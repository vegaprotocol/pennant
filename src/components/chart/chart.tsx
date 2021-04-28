import "./chart.scss";

import {
  Annotation,
  ChartType,
  DataSource,
  Overlay,
  PriceMonitoringBounds,
  Study,
} from "../../types";
import { constructTopLevelSpec, getCandleWidth } from "../../helpers";

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

export type Bounds = {
  date: Date;
  intervalWidth: number;
};

export type Options = {
  chartType?: ChartType;
  overlays?: Overlay[];
  studies?: Study[];
};

export type ChartProps = {
  dataSource: DataSource;
  initialBounds?: Bounds;
  interval: Interval;
  options?: Options;
  onBoundsChanged?: (bounds: Bounds) => void;
  onOptionsChanged?: (options: Options) => void;
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
      onOptionsChanged = () => {},
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
    const [data, setData] = useState<any[]>([]);
    const [annotations, setAnnotations] = useState<Annotation[]>([]);

    const [
      priceMonitoringBounds,
      setPriceMonitoringBounds,
    ] = useState<PriceMonitoringBounds | null>(null);

    const [bounds, setBounds] = useState<[Date, Date]>([
      new Date(),
      new Date(),
    ]);

    const [selectedIndex, setCandle] = useState<number | null>(null);
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
      async (from: string, to: string, merge = true) => {
        const newData = await dataSource.query(interval, from, to);

        setData((data) => mergeData(newData, merge ? data : []));
      },
      [dataSource, interval]
    );

    // Respond to streaming data
    useEffect(() => {
      const fetchData = async () => {
        await query(
          new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString(),
          new Date().toISOString(),
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

    const handleGetDataRange = useCallback(
      (from: string, to: string) => {
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

    const handleOnMouseOut = useCallback(() => setCandle(null), []);

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
                initialBounds={extent(data.map((d) => d.date)) as [Date, Date]}
                onBoundsChanged={setBounds}
                onMouseMove={setCandle}
                onMouseOut={handleOnMouseOut}
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
