import "./chart.scss";

import * as React from "react";

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

export const Chart = React.forwardRef(
  (
    {
      dataSource,
      interval,
      options: { chartType = "candle", studies = [], overlays = [] } = {
        chartType: "candle",
        studies: [],
        overlays: [],
      },
    }: ChartProps,
    ref: React.Ref<ChartElement>
  ) => {
    React.useImperativeHandle(ref, () => ({
      fitBounds: (bounds: [Date, Date]) => {
        chartRef.current.fitBounds(bounds);
      },
      panBy: (n: number) => {
        chartRef.current.reset();
      },
      panTo: (x: Date) => {
        chartRef.current.reset();
      },
      reset: () => {
        chartRef.current.reset();
      },
      snapshot: () => {
        return chartRef.current.snapshot();
      },
    }));

    const chartRef = React.useRef<ChartElement>(null!);
    const [data, setData] = React.useState<any[]>([]);
    const [annotations, setAnnotations] = React.useState<Annotation[]>([]);

    const [
      priceMonitoringBounds,
      setPriceMonitoringBounds,
    ] = React.useState<PriceMonitoringBounds | null>(null);

    const [bounds, setBounds] = React.useState<[Date, Date]>([
      new Date(),
      new Date(),
    ]);

    const [selectedIndex, setCandle] = React.useState<number | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [internalInterval, setInternalInterval] = React.useState(interval);

    const specification = React.useMemo(
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
    const scenegraph = React.useMemo(() => {
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
    const query = React.useCallback(
      async (from: string, to: string, merge = true) => {
        const newData = await dataSource.query(interval, from, to);

        setData((data) => mergeData(newData, merge ? data : []));
      },
      [dataSource, interval]
    );

    // Respond to streaming data
    React.useEffect(() => {
      const fetchData = async () => {
        console.time("query");

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
    React.useEffect(() => {
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

    React.useEffect(() => {
      setIsLoading(true);

      dataSource.onReady().then((configuration) => {
        console.info(`Data Source ready:`, configuration);
        setIsLoading(false);

        if (configuration.priceMonitoringBounds.length > 0) {
          setPriceMonitoringBounds(configuration.priceMonitoringBounds[0]);
        }
      });
    }, [dataSource]);

    const handleGetDataRange = React.useCallback(
      (from: string, to: string) => {
        query(from, to);
      },
      [query]
    );

    const handleOnMouseOut = React.useCallback(() => setCandle(null), []);

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
                specification={specification}
                scenegraph={scenegraph}
                interval={internalInterval}
                initialBounds={extent(data.map((d) => d.date)) as [Date, Date]}
                onBoundsChanged={setBounds}
                onMouseMove={setCandle}
                onMouseOut={handleOnMouseOut}
                onGetDataRange={handleGetDataRange}
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
