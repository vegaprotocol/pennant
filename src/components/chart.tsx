import "./chart.scss";

import * as React from "react";

import AutoSizer from "react-virtualized-auto-sizer";
import { CandleInfo } from "./candle-info";
import { CandlestickChart } from "./candlestick-chart";
import { ChartInfo } from "./chart-info";
import { DataSource } from "../types/data-source";
import { Interval } from "../api/vega-graphql";
import { NonIdealState } from "@blueprintjs/core";
import { mergeData } from "../helpers";

export type ChartProps = {
  dataSource: DataSource;
  interval: Interval;
};

export const Chart = React.forwardRef(
  ({ dataSource, interval }: ChartProps, ref: React.Ref<{ reset(): void }>) => {
    React.useImperativeHandle(ref, () => ({
      reset: () => {
        chartRef.current.reset();
      },
    }));

    const chartRef = React.useRef<{ reset(): void }>(null!);
    const [data, setData] = React.useState<any[]>([]);
    const [bounds, setBounds] = React.useState<[Date, Date]>([
      new Date(),
      new Date(),
    ]);
    const [selectedIndex, setCandle] = React.useState<number | null>(null);

    const query = React.useCallback(
      async (from: string, to: string, merge = true) => {
        const newData = await dataSource.query(interval, from, to);

        // TODO: need convenience functions for calculating range, sorting and distinct values and merging
        setData((data) => mergeData(merge ? data : [], newData));
      },
      [dataSource, interval]
    );

    React.useEffect(() => {
      function subscribe() {
        dataSource.subscribe(interval, (datum) => {
          setData((data) => mergeData(data, [datum]));
        });
      }

      const myDataSource = dataSource;

      query(
        new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString(),
        new Date().toISOString(),
        false
      );

      subscribe();

      return () => {
        myDataSource.unsubscribe();
      };
    }, [dataSource, interval, query]);

    const handleGetDataRange = React.useCallback(
      (from: string, to: string) => {
        query(from, to);
      },
      [query]
    );

    const handleOnMouseOut = React.useCallback(() => setCandle(null), []);

    return (
      <div>
        {data.length > 0 ? (
          <div className="chart-wrapper">
            <AutoSizer
              defaultHeight={150}
              defaultWidth={300}
              style={{ height: "100%", width: "100%" }} // TODO: Find a better method
            >
              {({ height, width }) => (
                <CandlestickChart
                  ref={chartRef}
                  width={width}
                  height={height}
                  data={data}
                  interval={interval}
                  onBoundsChanged={setBounds}
                  onMouseMove={setCandle}
                  onMouseOut={handleOnMouseOut}
                  onGetDataRange={handleGetDataRange}
                />
              )}
            </AutoSizer>
            <div className="overlay">
              <ChartInfo interval={interval} bounds={bounds} />
              {selectedIndex && <CandleInfo candle={data[selectedIndex]} />}
            </div>
          </div>
        ) : (
          <NonIdealState
            icon="timeline-line-chart"
            title="No data found"
            description="Try a different market"
          />
        )}
      </div>
    );
  }
);
