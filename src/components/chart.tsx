import * as React from "react";

import AutoSizer from "react-virtualized-auto-sizer";
import { CandlestickChart } from "./candlestick-chart";
import { DataSource } from "../types/data-source";
import { Interval } from "../data/globalTypes";
import { format } from "date-fns";

function mergeData(
  a: { date: Date; datetime: string }[],
  b: { date: Date; datetime: string }[]
) {
  let i = 0;
  let j = 0;

  const mergedArray = [];

  while (i < a.length && j < b.length) {
    if (a[i].date < b[j].date) {
      mergedArray.push(a[i++]);
    } else if (a[i].date > b[j].date) {
      mergedArray.push(b[j++]);
    } else {
      mergedArray.push(a[i++]);
      j++;
    }
  }

  while (i < a.length) {
    mergedArray.push(a[i++]);
  }

  while (j < b.length) {
    mergedArray.push(b[j++]);
  }

  return mergedArray;
}

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
    const [position, setPosition] = React.useState<[number, number]>();

    const query = React.useCallback(
      async (from: string, to: string) => {
        const newData = await dataSource.query(interval, from, to);

        console.info("newest data", newData);

        // TODO: need convenience functions for calculating range, sorting and distinct values and merging
        setData((data) => mergeData(data, newData));
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

      query(new Date(2021, 1, 17, 13).toISOString(), new Date().toISOString());
      //subscribe();

      return () => {
        myDataSource.unsubscribe();
      };
    }, [dataSource, interval, query]);

    const handleGetDataRange = (from: string, to: string) => {
      //query(from, to);
    };

    return (
      <div>
        <p>
          {format(bounds[0], "MMM d HH:mm")} -{" "}
          {format(bounds[1], "MMM d HH:mm")}
        </p>
        <p>{position && `${position[0]}, ${position[1]}`}</p>
        {data.length > 0 && (
          <div
            style={{
              resize: "both",
              overflow: "auto",
              width: "800px",
              height: "600px",
            }}
          >
            <AutoSizer
              defaultHeight={150}
              defaultWidth={300}
              style={{ height: "100%", width: "100%" }}
            >
              {({ height, width }) => (
                <CandlestickChart
                  ref={chartRef}
                  width={width}
                  height={height}
                  data={data}
                  interval={interval}
                  onBoundsChanged={setBounds}
                  onMouseMove={setPosition}
                  onGetDataRange={handleGetDataRange}
                />
              )}
            </AutoSizer>
          </div>
        )}
      </div>
    );
  }
);
