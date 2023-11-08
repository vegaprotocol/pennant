import "allotment/dist/style.css";
import "../../styles/variables.css";
import "./candlestick-chart.css";

import { ErrorBoundary, NonIdealState, PlotContainer } from "@ui/components";
import {
  INITIAL_NUM_CANDLES_TO_DISPLAY,
  INITIAL_NUM_CANDLES_TO_FETCH,
} from "@util/constants";
import {
  constructTopLevelSpec,
  getCandleWidth,
  getSubMinutes,
  mergeData,
} from "@util/misc";
import { parse } from "@util/scenegraph";
import {
  Annotation,
  Bounds,
  Candle,
  ChartElement,
  ChartType,
  DataSource,
  Interval,
  Overlay,
  Study,
  ThemeVariant,
  Viewport,
} from "@util/types";
import { dispatch } from "d3-dispatch";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import { Colors, getColors } from "./helpers";
import { useGetDimensions, useOnReady } from "./hooks";

const noop = () => {};

export type Options = {
  chartType?: ChartType;
  overlays?: Overlay[];
  studies?: Study[];
  simple?: boolean;
  initialNumCandlesToDisplay?: number;
  initialNumCandlesToFetch?: number;
  notEnoughDataText?: React.ReactNode;
  /**
   * Preferred size of a study pane. The Chart will attempt to use this size when adding a study pane (including on initial mount) as well as when a user double clicks a sash, or the `reset` method is called on the Chart instance.
   * @remarks The size can either be a number or a string.
   *
   * If it is a number it will be interpreted as a number of pixels.
   *
   * If it is a string it should end in either "px" or "%". If it ends in "px" it will be interpreted as a number of pixels, e.g. "120px".
   *
   * If it ends in "%" it will be interpreted as a percentage of the size of the main pane, e.g. "50%".
   */
  studySize?: number | string;
  studySizes?: Array<number | string>;
};

export type CandlestickChartProps = {
  /** Responsible for fetching data */
  dataSource: DataSource;
  initialViewport?: Viewport;
  interval: Interval;
  options?: Options;
  theme?: ThemeVariant;
  drawThrottleMs?: number;
  onOptionsChanged?: (options: Options) => void;
  onPaneChanged?: (size: number[]) => void;
  onViewportChanged?: (viewport: Viewport) => void;
};

export const CandlestickChart = forwardRef(
  (
    {
      dataSource,
      interval,
      options = {
        chartType: ChartType.CANDLE,
        studies: [],
        overlays: [],
        initialNumCandlesToDisplay: INITIAL_NUM_CANDLES_TO_DISPLAY,
        initialNumCandlesToFetch: INITIAL_NUM_CANDLES_TO_FETCH,
        studySize: "50%",
        studySizes: [],
      },
      initialViewport,
      theme = "dark",
      drawThrottleMs = 16.67,
      onOptionsChanged = noop,
      onPaneChanged = noop,
      onViewportChanged = noop,
    }: CandlestickChartProps,
    ref: React.Ref<ChartElement>,
  ) => {
    const {
      chartType = ChartType.CANDLE,
      studies = [],
      overlays = [],
      simple = false,
      initialNumCandlesToDisplay:
        initialNumCandles = INITIAL_NUM_CANDLES_TO_DISPLAY,
      initialNumCandlesToFetch:
        initialNumCandlesToFetch = INITIAL_NUM_CANDLES_TO_FETCH,
      notEnoughDataText,
      studySize = "50%",
      studySizes = [],
    } = options;
    useImperativeHandle(ref, () => ({
      panBy: (n: number) => {
        chartRef.current.panBy(n);
      },
      reset: () => {
        chartRef.current.reset();
      },
      snapshot: async () => {
        return chartRef.current ? await chartRef.current.snapshot() : null;
      },
      subscribe: (typenames: string, callback: (...args: any[]) => void) => {
        listeners.current.on(typenames, callback);
      },
      zoomIn: (delta: number) => {
        chartRef.current.zoomIn(delta);
      },
      zoomOut: (delta: number) => {
        chartRef.current.zoomOut(delta);
      },
    }));

    const [width, setWidth] = useState(400);
    const chartRef = useRef<ChartElement>(null!);
    const styleRef = useRef<HTMLDivElement>(null!);
    const listeners = useRef(dispatch("contextmenu"));
    const [data, setData] = useState<Candle[]>([]);
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [internalInterval, setInternalInterval] = useState(interval);
    const [colors, setColors] = useState<Colors>(getColors(null));

    const dimensions = useGetDimensions(styleRef.current);
    const [loading, setLoading] = useState(true);

    // Callback for fetching historical data
    const query = useCallback(
      async (from: Date, to: Date, interval: Interval, merge = true) => {
        const newData = await dataSource.query(
          interval,
          from.toISOString(),
          to.toISOString(),
        );

        setData((data) => mergeData(newData, merge ? data : []));
        setLoading(false);
      },
      [dataSource],
    );

    // Wait for data source onReady call before showing content
    const { ready: dataSourceInitializing, configuration } =
      useOnReady(dataSource);

    const specification = useMemo(
      () =>
        constructTopLevelSpec(
          data,
          chartType,
          colors,
          overlays,
          studies,
          configuration?.priceMonitoringBounds,
        ),
      [
        data,
        chartType,
        colors,
        overlays,
        studies,
        configuration?.priceMonitoringBounds,
      ],
    );

    const candleWidth = getCandleWidth(internalInterval);
    const [timeViewRange, setTimeViewRange] = useState(
      initialNumCandles * candleWidth,
    );
    const pixelsToTime = timeViewRange / width;

    // Compile data and view specification into scenegraph ready for rendering
    const scenegraph = useMemo(
      () =>
        parse(
          specification,
          candleWidth,
          dimensions,
          pixelsToTime,
          dataSource.decimalPlaces,
          annotations,
        ),
      [
        annotations,
        dataSource.decimalPlaces,
        dimensions,
        specification,
        pixelsToTime,
        candleWidth,
      ],
    );

    // Initial data fetch and subscriptions
    useEffect(() => {
      const fetchData = async (interval: Interval) => {
        await query(
          new Date(
            new Date().getTime() -
              1000 * 60 * getSubMinutes(interval, initialNumCandlesToFetch),
          ),
          new Date(),
          interval,
          false,
        );

        setInternalInterval(interval);
      };

      function subscribe(interval: Interval) {
        dataSource.subscribeData(interval, (datum) => {
          setData((data) => mergeData([datum], data));
        });
      }

      if (!dataSourceInitializing) {
        const myDataSource = dataSource;

        // Initial data fetch
        fetchData(interval);

        // Set up subscriptions
        subscribe(interval);

        return () => {
          myDataSource.unsubscribeData();
          setData([]);
        };
      }
    }, [
      dataSource,
      dataSourceInitializing,
      initialNumCandlesToFetch,
      interval,
      query,
    ]);

    // React to streaming annotations changes
    useEffect(() => {
      function subscribe() {
        if (dataSource.subscribeAnnotations && !simple) {
          dataSource.subscribeAnnotations((annotations) => {
            setAnnotations(annotations);
          });
        }
      }

      if (!dataSourceInitializing) {
        const myDataSource = dataSource;

        subscribe();

        return () => {
          myDataSource.unsubscribeAnnotations &&
            myDataSource.unsubscribeAnnotations();
          setAnnotations([]);
        };
      }
    }, [dataSource, dataSourceInitializing, simple]);

    useEffect(() => {
      // Hack to ensure we pick up the changed css
      requestAnimationFrame(() => {
        setColors(getColors(styleRef?.current));
      });
    }, [theme]);

    const handleBoundsChanged = useCallback((bounds: Bounds) => {
      setTimeViewRange(bounds[1].getTime() - bounds[0].getTime());
      setWidth(styleRef.current?.getBoundingClientRect().width ?? 0);
    }, []);

    const handleViewportChanged = useCallback(
      (viewport: Viewport) => {
        onViewportChanged(viewport);
      },
      [onViewportChanged],
    );

    const handleGetDataRange = useCallback(
      (from: Date, to: Date, interval: Interval) => {
        query(from, to, interval);
      },
      [query],
    );

    const handleClosePane = useCallback(
      (id: string) => {
        onOptionsChanged({
          ...options,
          studies: studies.filter((study) => study !== id),
        });
      },
      [onOptionsChanged, options, studies],
    );

    const handleRemoveOverlay = useCallback(
      (id: string) => {
        onOptionsChanged({
          ...options,
          overlays: overlays.filter((overlay) => overlay !== id),
        });
      },
      [onOptionsChanged, options, overlays],
    );

    const viewport = useMemo(
      () =>
        initialViewport ?? {
          date: data.length > 0 ? data[data.length - 1].date : new Date(),
          intervalWidth: 10,
        },
      [data, initialViewport],
    );

    // Show fallback UI while waiting for data
    if (loading) {
      return (
        <div ref={styleRef} className="chart__wrapper" data-theme={theme}>
          <NonIdealState title="Loading" />
        </div>
      );
    }

    // We failed to construct a scenegraph. Something went wrong with the data
    if (!scenegraph) {
      return (
        <div ref={styleRef} className="chart__wrapper" data-theme={theme}>
          <NonIdealState title={notEnoughDataText || "No data found"} />
        </div>
      );
    }

    return (
      <ErrorBoundary>
        <div ref={styleRef} className="chart__wrapper" data-theme={theme}>
          <PlotContainer
            ref={chartRef}
            width={400}
            height={300}
            decimalPlaces={dataSource.decimalPlaces}
            positionDecimalPlaces={dataSource.positionDecimalPlaces}
            priceMonitoringBounds={configuration?.priceMonitoringBounds ?? []}
            scenegraph={scenegraph}
            interval={internalInterval}
            initialViewport={viewport}
            overlays={overlays}
            simple={simple}
            initialNumCandles={initialNumCandles}
            colors={colors}
            studySize={studySize}
            studySizes={studySizes}
            drawThrottleMs={drawThrottleMs}
            onViewportChanged={handleViewportChanged}
            onGetDataRange={handleGetDataRange}
            onClosePane={handleClosePane}
            onChangePane={onPaneChanged}
            onRemoveOverlay={handleRemoveOverlay}
            onRightClick={(event: any) => {
              listeners.current.call("contextmenu", undefined, event);
            }}
            onBoundsChanged={handleBoundsChanged}
          />
        </div>
      </ErrorBoundary>
    );
  },
);
