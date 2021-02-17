import * as React from "react";

import { CandlestickChart } from "./candlestick-chart";
import { DataSource } from "../types/data-source";
import { Interval } from "../data/globalTypes";
import { extent } from "d3-array";
import { unionBy } from "lodash";

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
    } else if (a[i].date > b[i].date) {
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

  console.log(a, b, mergedArray);

  return mergedArray;
}

export type ChartProps = {
  dataSource: DataSource;
};

export const Chart = ({ dataSource }: ChartProps) => {
  const [data, setData] = React.useState<any[]>([]);

  const query = React.useCallback(
    async (from: string, to: string) => {
      console.log(from, to);
      const newData = await dataSource.query(Interval.I1M, from, to);

      // TODO: need convenience functions for calculating range, sorting and distinct values and merging
      setData((data) => mergeData(data, newData));
    },
    [dataSource]
  );

  React.useEffect(() => {
    function subscribe() {
      dataSource.subscribe(Interval.I1M, (datum) => {
        const foundIndex = data.findIndex((d) => d.datetime === datum.datetime);

        const newData = [...data];

        if (foundIndex === -1) {
          newData.push(datum);
        } else {
          newData[foundIndex] = datum;
        }

        //setData(newData);
      });
    }

    const myDataSource = dataSource;

    query(new Date(2021, 1, 17, 13).toISOString(), new Date().toISOString());
    subscribe();

    return () => {
      myDataSource.unsubscribe();
    };
  }, [dataSource, query]);

  const handleGetDataRange = (from: string, to: string) => {
    console.log("getRange");
    query(from, to);
  };

  return (
    <div>
      <CandlestickChart data={data} onGetDataRange={handleGetDataRange} />
    </div>
  );
};
