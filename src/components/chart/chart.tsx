import "./chart.scss";

import {
  Annotation,
  Viewport,
  Candle,
  ChartType,
  DataSource,
  Overlay,
  PriceMonitoringBounds,
  Study,
} from "../../types";
import {
  constructTopLevelSpec,
  getCandleWidth,
  getSubMinutes,
} from "../../helpers";

import AutoSizer from "react-virtualized-auto-sizer";
import { ChartElement } from "../../types";
import { ErrorBoundary } from "../error-boundary";
import { Interval } from "../../stories/api/vega-graphql";
import { NonIdealState } from "../non-ideal-state";
import { PlotContainer } from "../plot-container";
import { extent } from "d3-array";
import { mergeData } from "../../helpers";
import { parse } from "../../scenegraph/parse";
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
      onOptionsChanged = () => {},
      onViewportChanged = () => {},
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
      snapshot: () => {
        return chartRef.current.snapshot();
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
    const scenegraph = useMemo(() => {
      return parse(
        specification,
        getCandleWidth(internalInterval),
        dataSource.decimalPlaces,
        annotations
      );
    }, [
      annotations,
      dataSource.decimalPlaces,
      internalInterval,
      specification,
    ]);

    // Fetch historical data
    const query = useCallback(
      async (from: Date, to: Date, merge = true) => {
        const newData = await dataSource.query(
          interval,
          from.toISOString(),
          to.toISOString()
        );

        setData((data) => mergeData(newData, merge ? data : []));
      },
      [dataSource, interval]
    );

    // Respond to streaming data
    useEffect(() => {
      const fetchData = async () => {
        await query(
          new Date(
            new Date().getTime() -
              1000 * 60 * getSubMinutes(interval, INITIAL_NUM_CANDLES)
          ),
          new Date(),
          false
        );

        setInternalInterval(interval);
      };

      function subscribe() {
        dataSource.subscribeData(interval, (datum) => {
          setData((data) => mergeData([datum], data));
        });
      }

      const myDataSource = dataSource;

      // Initial data fetch
      fetchData();

      // Set up subscriptions
      subscribe();

      return () => {
        myDataSource.unsubscribeData();
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
      (from: Date, to: Date) => {
        query(from, to);
      },
      [query]
    );

    const handleClosePanel = useCallback(
      (id: string) => {
        onOptionsChanged({
          ...options,
          studies: studies.filter((study) => study !== id),
        });
      },
      [onOptionsChanged, options, studies]
    );

    if (isLoading) {
      return <NonIdealState title="Loading" />;
    }

    return !isLoading && scenegraph ? (
      <ErrorBoundary>
        <div className="chart-wrapper">
          <AutoSizer
            defaultHeight={150}
            defaultWidth={300}
            style={{ height: "100%", width: "100%" }}
          >
            {({ height, width }) => (
              <PlotContainer
                ref={chartRef}
                width={width}
                height={height}
                scenegraph={scenegraph}
                interval={internalInterval}
                initialViewport={
                  initialViewport ?? {
                    date: data[data.length - 1].date,
                    intervalWidth: 10,
                  }
                }
                onViewportChanged={handleViewportChanged}
                onGetDataRange={handleGetDataRange}
                onClosePanel={handleClosePanel}
              />
            )}
          </AutoSizer>
        </div>
      </ErrorBoundary>
    ) : (
      <NonIdealState title="No data found" />
    );
  }
);
