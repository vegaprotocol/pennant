import "../../styles/variables.css";
import "./chart.css";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import { INITIAL_NUM_CANDLES } from "../../constants";
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
  PriceMonitoringBounds,
  Study,
  Viewport,
} from "../../types";
import { ErrorBoundary } from "../error-boundary";
import { NonIdealState } from "../non-ideal-state";
import { PlotContainer } from "../plot-container";

const noop = () => {};

export type Options = {
  chartType?: ChartType;
  overlays?: Overlay[];
  studies?: Study[];
};

export type ChartProps = {
  dataSource: DataSource;
  initialViewport?: Viewport;
  interval: Interval;
  options?: Options;
  onOptionsChanged?: (options: Options) => void;
  onViewportChanged?: (viewport: Viewport) => void;
};

export const Chart = forwardRef(
  (
    {
      dataSource,
      interval,
      options = {
        chartType: "candle",
        studies: [],
        overlays: [],
      },
      initialViewport,
      onOptionsChanged = noop,
      onViewportChanged = noop,
    }: ChartProps,
    ref: React.Ref<ChartElement>
  ) => {
    const { chartType = "candle", studies = [], overlays = [] } = options;

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
      zoomIn: (delta: number) => {
        chartRef.current.zoomIn(delta);
      },
      zoomOut: (delta: number) => {
        chartRef.current.zoomOut(delta);
      },
    }));

    const chartRef = useRef<ChartElement>(null!);
    const [data, setData] = useState<Candle[]>([]);
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [proportion, setProportion] = useState(2 / 3);

    const [
      priceMonitoringBounds,
      setPriceMonitoringBounds,
    ] = useState<PriceMonitoringBounds | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [internalInterval, setInternalInterval] = useState(interval);

    const specification = useMemo(
      () =>
        constructTopLevelSpec(
          data,
          chartType,
          overlays[0],
          studies[0],
          priceMonitoringBounds
        ),
      [chartType, data, overlays, priceMonitoringBounds, studies]
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

    // Fetch historical data
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

    // Respond to streaming data
    useEffect(() => {
      const fetchData = async (interval: Interval) => {
        await query(
          new Date(
            new Date().getTime() -
              1000 * 60 * getSubMinutes(interval, INITIAL_NUM_CANDLES)
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

      const myDataSource = dataSource;

      // Initial data fetch
      fetchData(interval);

      // Set up subscriptions
      subscribe(interval);

      return () => {
        myDataSource.unsubscribeData();
        setData([]);
      };
    }, [dataSource, interval, query]);

    // Respond to streaming annotations
    useEffect(() => {
      function subscribe() {
        if (dataSource.subscribeAnnotations) {
          dataSource.subscribeAnnotations((annotations) => {
            setAnnotations(annotations);
          });
        }
      }

      const myDataSource = dataSource;

      subscribe();

      return () => {
        myDataSource.unsubscribeAnnotations &&
          myDataSource.unsubscribeAnnotations();
        setAnnotations([]);
      };
    }, [dataSource]);

    useEffect(() => {
      setIsLoading(true);

      dataSource.onReady().then((configuration) => {
        setIsLoading(false);

        if (configuration.priceMonitoringBounds.length > 0) {
          setPriceMonitoringBounds(configuration.priceMonitoringBounds[0]);
        }
      });
    }, [dataSource]);

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

    if (isLoading) {
      return <NonIdealState title="Loading" />;
    }

    return !isLoading && scenegraph ? (
      <ErrorBoundary>
        <div className="chart__wrapper">
          <PlotContainer
            ref={chartRef}
            width={400}
            height={300}
            decimalPlaces={dataSource.decimalPlaces}
            scenegraph={scenegraph}
            interval={internalInterval}
            initialViewport={viewport}
            overlays={overlays}
            proportion={proportion}
            onViewportChanged={handleViewportChanged}
            onGetDataRange={handleGetDataRange}
            onClosePane={handleClosePane}
            onProportionChanged={setProportion}
          />
        </div>
      </ErrorBoundary>
    ) : (
      <NonIdealState title="No data found" />
    );
  }
);
