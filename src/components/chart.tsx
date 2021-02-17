import * as React from "react";

import { CandlestickChart } from "./candlestick-chart";
import { DataSource } from "../types/data-source";
import { Interval } from "../data/globalTypes";

export type ChartProps = {
  dataSource: DataSource;
};

export const Chart = ({ dataSource }: ChartProps) => {
  const [data, setData] = React.useState<any[]>([]);
  const [currentData, setCurrentData] = React.useState<any>(null);

  const query = React.useCallback(
    async (from: string, to: string) => {
      const data = await dataSource.query(Interval.I1M, from, to);

      setData(data);
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

        setCurrentData(datum);
      });
    }

    const myDataSource = dataSource;

    query(new Date(2021, 1, 17, 12).toISOString(), new Date().toISOString());
    //subscribe();

    return () => {
      //myDataSource.unsubscribe();
    };
  }, [dataSource, query]);

  const handleGetDataRange = (from: string, to: string) => {
    query(from, to);
  };

  return (
    <div>
      <CandlestickChart data={data} onGetDataRange={handleGetDataRange} />
    </div>
  );
};
