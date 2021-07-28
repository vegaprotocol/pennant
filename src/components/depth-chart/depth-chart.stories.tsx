import { Meta, Story } from "@storybook/react";
import { orderBy } from "lodash";
import { useRef, useState } from "react";

import { useInterval } from "../../hooks";
import {
  DepthChart,
  DepthChartHandle,
  DepthChartProps,
  PriceLevel,
} from "./depth-chart";
import data from "./depth-chart.stories.json";

export default {
  title: "Components/DepthChart",
  DepthChart,
} as Meta;

const Template: Story<DepthChartProps> = (args) => {
  const ref = useRef<DepthChartHandle>(null!);

  const [isLoading, setIsLoading] = useState(true);

  const [data, setData] = useState<{ buy: PriceLevel[]; sell: PriceLevel[] }>({
    buy: [],
    sell: [],
  });

  useInterval(() => {
    async function fecthData() {
      const res = await fetch(
        `https://www.binance.com/api/v3/depth?symbol=BTCGBP&limit=1000`
      );

      const json = await res.json();

      setData({
        sell: orderBy(
          json.asks.map((ask: [string, string]) => ({
            price: +ask[0],
            volume: +ask[1],
          })),
          ["price"]
        ),
        buy: orderBy(
          json.bids.map((bid: [string, string]) => ({
            price: +bid[0],
            volume: +bid[1],
          })),
          ["price"],
          ["desc"]
        ),
      });

      setIsLoading(false);
    }

    fecthData();
  }, 5000);

  if (isLoading) {
    return <p>Loading</p>;
  }

  return (
    <div>
      <div
        style={{
          resize: "both",
          overflow: "auto",
          width: "420px",
          height: "240px",
        }}
      >
        <DepthChart ref={ref} data={data} />
      </div>
      <div>
        <ul>
          {[...data.buy]
            .reverse()
            .filter((_priceLevel, index) => index % 50 === 0)
            .map((priceLevel, index) => (
              <li
                key={index}
                onMouseEnter={() => {
                  ref.current.update(priceLevel.price);
                }}
                onMouseLeave={() => {
                  ref.current.clear();
                }}
              >
                {priceLevel.price}
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
};

export const Binance = Template.bind({});
