import * as React from "react";

import { CandlestickChart } from "./candlestick-chart";
import { DataSource } from "../types/data-source";
import { Interval } from "../data/globalTypes";

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

export const Chart = ({ dataSource, interval }: ChartProps) => {
  const [data, setData] = React.useState<any[]>([]);

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
  }, [dataSource, query]);

  const handleGetDataRange = (from: string, to: string) => {
    //query(from, to);
  };

  return (
    <div>
      {data.length > 0 && (
        <CandlestickChart
          data={data}
          interval={interval}
          onGetDataRange={handleGetDataRange}
        />
      )}
    </div>
  );
};
