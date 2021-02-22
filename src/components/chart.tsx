import * as React from "react";

import { Button, Colors } from "@blueprintjs/core";
import { CandleDetailsExtended, CandlestickChart } from "./candlestick-chart";

import AutoSizer from "react-virtualized-auto-sizer";
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
    const [candle, setCandle] = React.useState<CandleDetailsExtended | null>(
      null
    );

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
        {data.length > 0 && (
          <div
            style={{
              position: "relative",
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
                  onMouseMove={setCandle}
                  onMouseOut={() => setCandle(null)}
                  onGetDataRange={handleGetDataRange}
                />
              )}
            </AutoSizer>
            <div
              style={{
                position: "absolute",
                top: 0,
                //pointerEvents: "none",
                padding: "8px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: "8px",
                  paddingBottom: "4px",
                }}
              >
                <Button small text={interval} />
                <div>
                  <span>{`${format(bounds[0], "HH:mm dd MMM yyyy")}`}</span>
                  <span className="bp3-text-muted"> to </span>
                  <span>{`${format(bounds[1], "HH:mm dd MMM yyyy")}`}</span>
                </div>
              </div>
              {candle && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    gap: "8px",
                    backgroundColor: "rgba(0,0,0,0.7)",
                  }}
                >
                  <div>
                    <span className="bp3-text-muted">Candle: </span>
                    <span className="bp3-monospace-text">
                      {candle?.date &&
                        format(candle?.date, "HH:mm dd MMM yyyy")}
                    </span>
                  </div>
                  <div>
                    <span className="bp3-text-muted">O </span>
                    <span className="bp3-monospace-text">
                      {candle?.open.toFixed(1)}
                    </span>
                  </div>
                  <div>
                    <span className="bp3-text-muted">H </span>
                    <span className="bp3-monospace-text">
                      {candle?.high.toFixed(1)}
                    </span>
                  </div>
                  <div>
                    <span className="bp3-text-muted">L </span>
                    <span className="bp3-monospace-text">
                      {candle?.low.toFixed(1)}
                    </span>
                  </div>
                  <div>
                    <span className="bp3-text-muted">C </span>
                    <span className="bp3-monospace-text">
                      {candle?.close.toFixed(1)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);
