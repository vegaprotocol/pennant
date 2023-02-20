import "allotment/dist/style.css";
import "../../styles/variables.css";
import "./candlestick-chart.css";

import {
  constructTopLevelSpec,
  getCandleWidth,
  getSubMinutes,
  mergeData,
} from "@util/misc";
import { dispatch } from "d3-dispatch";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Annotation,
  Candle,
  ChartElement,
  ChartType,
  DataSource,
  Interval,
  Overlay,
  Study,
  ThemeVariant,
  Viewport,
} from "../../types";
import {
  ErrorBoundary,
  NonIdealState,
  PlotContainer,
} from "../../ui/components";
import {
  INITIAL_NUM_CANDLES_TO_DISPLAY,
  INITIAL_NUM_CANDLES_TO_FETCH,
} from "../../util/constants";
import { parse } from "../../util/scenegraph/parse";
import { Colors, Dimensions, getColors, getDimensions } from "./helpers";
import { useOnReady } from "./hooks";

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
};

export type CandlestickChartProps = {
  /** Responsible for fetching data */
  dataSource: DataSource;
  initialViewport?: Viewport;
  interval: Interval;
  options?: Options;
  theme?: ThemeVariant;
  onOptionsChanged?: (options: Options) => void;
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
      },
      initialViewport,
      theme = "dark",
      onOptionsChanged = noop,
      onViewportChanged = noop,
    }: CandlestickChartProps,
    ref: React.Ref<ChartElement>
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

    const chartRef = useRef<ChartElement>(null!);
    const styleRef = useRef<HTMLDivElement>(null!);
    const listeners = useRef(dispatch("contextmenu"));
    const [data, setData] = useState<Candle[]>([]);
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [internalInterval, setInternalInterval] = useState(interval);
    const [colors, setColors] = useState<Colors>(getColors(null));

    const [dimensions, setDimensions] = useState<Dimensions>(
      getDimensions(null)
    );

    const [loading, setLoading] = useState(true);

    // Callback for fetching historical data
    const query = useCallback(
      async (from: Date, to: Date, interval: Interval, merge = true) => {
        const newData = await dataSource.query(
          interval,
          from.toISOString(),
          to.toISOString()
        );

        setData((data) => mergeData(newData, merge ? data : []));
        setLoading(false);
      },
      [dataSource]
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
          configuration?.priceMonitoringBounds
        ),
      [
        data,
        chartType,
        colors,
        overlays,
        studies,
        configuration?.priceMonitoringBounds,
      ]
    );

    // Compile data and view specification into scenegraph ready for rendering
    const scenegraph = useMemo(
      () =>
        parse(
          specification,
          getCandleWidth(internalInterval),
          dimensions.strokeWidth,
          dataSource.decimalPlaces,
          annotations
        ),
      [
        annotations,
        dataSource.decimalPlaces,
        dimensions.strokeWidth,
        internalInterval,
        specification,
      ]
    );

    // Initial data fetch and subscriptions
    useEffect(() => {
      const fetchData = async (interval: Interval) => {
        await query(
          new Date(
            new Date().getTime() -
              1000 * 60 * getSubMinutes(interval, initialNumCandlesToFetch)
          ),
          new Date(),
          interval,
          false
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
        setDimensions(getDimensions(styleRef?.current));
      });
    }, [theme]);

    const handleViewportChanged = useCallback(
      (viewport: Viewport) => {
        onViewportChanged(viewport);
      },
      [onViewportChanged]
    );

    const handleGetDataRange = useCallback(
      (from: Date, to: Date, interval: Interval) => {
        query(from, to, interval);
      },
      [query]
    );

    const handleClosePane = useCallback(
      (id: string) => {
        onOptionsChanged({
          ...options,
          studies: studies.filter((study) => study !== id),
        });
      },
      [onOptionsChanged, options, studies]
    );

    const handleRemoveOverlay = useCallback(
      (id: string) => {
        onOptionsChanged({
          ...options,
          overlays: overlays.filter((study) => study !== id),
        });
      },
      [onOptionsChanged, options, overlays]
    );

    const viewport = useMemo(
      () =>
        initialViewport ?? {
          date: data.length > 0 ? data[data.length - 1].date : new Date(),
          intervalWidth: 10,
        },
      [data, initialViewport]
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
            scenegraph={scenegraph}
            interval={internalInterval}
            initialViewport={viewport}
            overlays={overlays}
            simple={simple}
            initialNumCandles={initialNumCandles}
            colors={colors}
            studySize={studySize}
            onViewportChanged={handleViewportChanged}
            onGetDataRange={handleGetDataRange}
            onClosePane={handleClosePane}
            onRemoveOverlay={handleRemoveOverlay}
            onRightClick={(event: any) => {
              listeners.current.call("contextmenu", undefined, event);
            }}
          />
        </div>
      </ErrorBoundary>
    );
  }
);
