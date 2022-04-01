import "allotment/dist/style.css";
import "../../styles/variables.css";
import "./chart.css";

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
  INITIAL_NUM_CANDLES_TO_DISPLAY,
  INITIAL_NUM_CANDLES_TO_FETCH,
} from "../../constants";
import {
  constructTopLevelSpec,
  getCandleWidth,
  getSubMinutes,
} from "../../helpers";
import { mergeData } from "../../helpers";
import { parse } from "../../scenegraph/parse";
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
import { ErrorBoundary } from "../error-boundary";
import { NonIdealState } from "../non-ideal-state";
import { PlotContainer } from "../plot-container";
import { useOnReady } from "./hooks";
import { Colors, getColors } from "./helpers";

const noop = () => {};

export type Options = {
  chartType?: ChartType;
  overlays?: Overlay[];
  studies?: Study[];
  simple?: boolean;
  initialNumCandlesToDisplay?: number;
  initialNumCandlesToFetch?: number;
};

export type ChartProps = {
  /** Responsible for fetching data */
  dataSource: DataSource;
  initialViewport?: Viewport;
  interval: Interval;
  options?: Options;
  theme?: ThemeVariant;
  onOptionsChanged?: (options: Options) => void;
  onViewportChanged?: (viewport: Viewport) => void;
};

export const Chart = forwardRef(
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
      },
      initialViewport,
      theme = "dark",
      onOptionsChanged = noop,
      onViewportChanged = noop,
    }: ChartProps,
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

    // Callback for fetching historical data
    const query = useCallback(
      async (from: Date, to: Date, interval: Interval, merge = true) => {
        const newData = await dataSource.query(
          interval,
          from.toISOString(),
          to.toISOString()
        );

        setData((data) => mergeData(newData, merge ? data : []));
      },
      [dataSource]
    );

    // Wait for data source onReady call before showing content
    const { loading, configuration } = useOnReady(dataSource);

    const specification = useMemo(
      () =>
        constructTopLevelSpec(
          data,
          chartType,
          colors,
          overlays[0],
          studies[0],
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
          dataSource.decimalPlaces,
          annotations
        ),
      [annotations, dataSource.decimalPlaces, internalInterval, specification]
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

      if (!loading) {
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
    }, [dataSource, initialNumCandlesToFetch, interval, loading, query]);

    // React to streaming annotations changes
    useEffect(() => {
      function subscribe() {
        if (dataSource.subscribeAnnotations && !simple) {
          dataSource.subscribeAnnotations((annotations) => {
            setAnnotations(annotations);
          });
        }
      }

      if (!loading) {
        const myDataSource = dataSource;

        subscribe();

        return () => {
          myDataSource.unsubscribeAnnotations &&
            myDataSource.unsubscribeAnnotations();
          setAnnotations([]);
        };
      }
    }, [dataSource, loading, simple]);

    useEffect(() => {
      setColors(getColors(styleRef?.current));
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
          <NonIdealState title="No data found" />
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
            onViewportChanged={handleViewportChanged}
            onGetDataRange={handleGetDataRange}
            onClosePane={handleClosePane}
            onRightClick={(event: any) => {
              listeners.current.call("contextmenu", undefined, event);
            }}
          />
        </div>
      </ErrorBoundary>
    );
  }
);
