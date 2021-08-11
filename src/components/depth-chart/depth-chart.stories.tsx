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

export default {
  title: "Components/DepthChart",
  DepthChart,
} as Meta;

const AAPL_data = {
  buy: [
    { price: 132.79743, volume: 339 },
    { price: 132.79742, volume: 713 },
    { price: 132.79741, volume: 421 },
    { price: 132.7974, volume: 853 },
    { price: 132.79739, volume: 152 },
    { price: 132.79738, volume: 243 },
    { price: 132.79737, volume: 296 },
    { price: 132.79736, volume: 123 },
    { price: 132.79735, volume: 158 },
    { price: 132.79734, volume: 238 },
    { price: 132.79733, volume: 164 },
    { price: 132.79732, volume: 273 },
    { price: 132.79731, volume: 35 },
    { price: 132.79729, volume: 30 },
    { price: 132.79726, volume: 29 },
    { price: 132.79722, volume: 484 },
    { price: 132.79721, volume: 458 },
    { price: 132.7972, volume: 244 },
    { price: 132.79719, volume: 10 },
    { price: 132.79698, volume: 124 },
  ],
  sell: [
    { price: 132.79744, volume: 847 },
    { price: 132.79745, volume: 2412 },
    { price: 132.79746, volume: 635 },
    { price: 132.79747, volume: 323 },
    { price: 132.79748, volume: 828 },
    { price: 132.79749, volume: 322 },
    { price: 132.7975, volume: 268 },
    { price: 132.79751, volume: 92 },
    { price: 132.79752, volume: 249 },
    { price: 132.79753, volume: 189 },
    { price: 132.79754, volume: 179 },
    { price: 132.79755, volume: 122 },
    { price: 132.79756, volume: 28 },
    { price: 132.7976, volume: 114 },
    { price: 132.79764, volume: 27 },
    { price: 132.79767, volume: 10 },
    { price: 132.79772, volume: 31 },
    { price: 132.79785, volume: 484 },
    { price: 132.79786, volume: 364 },
    { price: 132.79787, volume: 244 },
  ],
};

const ETHBTC_data = {
  buy: [
    { price: 0.66332, volume: 648 },
    { price: 0.6633, volume: 1535 },
    { price: 0.0676, volume: 9503 },
    { price: 0.067, volume: 1116 },
    { price: 0.0664, volume: 100 },
    { price: 0.06632, volume: 1000 },
    { price: 0.0663, volume: 52 },
    { price: 0.065, volume: 200 },
  ],
  sell: [
    { price: 0.065, volume: 216 },
    { price: 0.0664, volume: 1 },
    { price: 0.067, volume: 1000 },
    { price: 0.6633, volume: 1549 },
    { price: 0.66332, volume: 533 },
  ],
};

const UNIDAI_data = {
  buy: [
    { price: 30.39959, volume: 423 },
    { price: 30.39957, volume: 38 },
    { price: 30.39954, volume: 27 },
    { price: 30.39953, volume: 74 },
    { price: 30.39946, volume: 38 },
    { price: 30.39945, volume: 17 },
    { price: 30.3994, volume: 24 },
    { price: 30.39938, volume: 21 },
    { price: 30.39928, volume: 18 },
    { price: 30.3852, volume: 642 },
    { price: 30.38519, volume: 16 },
    { price: 30.38518, volume: 108 },
    { price: 30.38517, volume: 50 },
    { price: 30.38516, volume: 63 },
    { price: 30.38514, volume: 39 },
    { price: 30.38513, volume: 38 },
    { price: 30.38512, volume: 63 },
    { price: 30.38511, volume: 23 },
    { price: 30.3851, volume: 24 },
    { price: 30.38506, volume: 31 },
  ],
  sell: [
    { price: 26.34844, volume: 15 },
    { price: 27.07547, volume: 100 },
    { price: 27.83572, volume: 5000 },
    { price: 28.2, volume: 200 },
    { price: 28.4567, volume: 1000 },
    { price: 28.54656, volume: 55 },
    { price: 28.7, volume: 200 },
    { price: 29.25288, volume: 31 },
    { price: 29.34414, volume: 31 },
    { price: 30.37575, volume: 370 },
    { price: 30.37576, volume: 49 },
    { price: 30.37577, volume: 120 },
    { price: 30.37578, volume: 11 },
    { price: 30.37581, volume: 6 },
    { price: 30.37584, volume: 20 },
    { price: 30.37586, volume: 23 },
    { price: 30.37587, volume: 35 },
    { price: 30.37589, volume: 54 },
    { price: 30.37593, volume: 32 },
    { price: 30.37594, volume: 15 },
  ],
};

export const Binance: Story<DepthChartProps> = (args) => {
  const ref = useRef<DepthChartHandle>(null!);

  const [isLoading, setIsLoading] = useState(true);

  const [data, setData] = useState<{ buy: PriceLevel[]; sell: PriceLevel[] }>({
    buy: [],
    sell: [],
  });

  useInterval(() => {
    async function fetchData() {
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

    fetchData();
  }, 5000);

  if (isLoading) {
    return <p>Loading</p>;
  }

  return (
    <div>
      <div
        style={{
          resize: "both",
          overflow: "scroll",
          width: "500px",
          height: "300px",
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

const Template: Story<DepthChartProps> = (args) => {
  const ref = useRef<DepthChartHandle>(null!);

  return (
    <div
      style={{
        width: "600px",
        height: "300px",
      }}
    >
      <DepthChart ref={ref} {...args} />
    </div>
  );
};

export const AAPL = Template.bind({});
AAPL.args = {
  data: AAPL_data,
};

export const ETHBTC = Template.bind({});
ETHBTC.args = {
  data: ETHBTC_data,
};

export const UNIDAI = Template.bind({});
UNIDAI.args = {
  data: UNIDAI_data,
};
