import { Meta, Story } from "@storybook/react";
import { orderBy } from "lodash";
import { useRef, useState } from "react";
import { useDarkMode } from "storybook-dark-mode";

import { useInterval } from "../../hooks";
import {
  DepthChart,
  DepthChartHandle,
  DepthChartProps,
  priceFormatter,
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

const BTCUSD_data = {
  buy: [
    { price: 44226.95501, volume: 22 },
    { price: 44226.955, volume: 36 },
    { price: 44226.95496, volume: 21 },
    { price: 44226.95495, volume: 12 },
    { price: 44226.95494, volume: 14 },
    { price: 44226.95493, volume: 23 },
    { price: 44226.95488, volume: 26 },
    { price: 44226.95479, volume: 16 },
    { price: 44170.48563, volume: 24 },
    { price: 44170.48561, volume: 49 },
    { price: 44170.4856, volume: 14 },
    { price: 44170.48557, volume: 13 },
    { price: 44170.48556, volume: 34 },
    { price: 44170.48554, volume: 22 },
    { price: 44170.4855, volume: 45 },
    { price: 44170.48549, volume: 17 },
    { price: 44170.48546, volume: 79 },
    { price: 44170.48545, volume: 13 },
    { price: 44170.48543, volume: 1 },
    { price: 44170.48542, volume: 17 },
  ],
  sell: [
    { price: 44283.4244, volume: 184 },
    { price: 44283.42441, volume: 12 },
    { price: 44283.42443, volume: 13 },
    { price: 44283.42444, volume: 78 },
    { price: 44283.42445, volume: 47 },
    { price: 44283.42446, volume: 44 },
    { price: 44283.42447, volume: 15 },
    { price: 44283.42448, volume: 47 },
    { price: 44283.42449, volume: 20 },
    { price: 44283.4245, volume: 41 },
    { price: 44283.42451, volume: 18 },
    { price: 44283.42452, volume: 52 },
    { price: 44283.42453, volume: 78 },
    { price: 44283.42454, volume: 49 },
    { price: 44283.42456, volume: 86 },
    { price: 44283.4246, volume: 5 },
    { price: 44283.42461, volume: 19 },
    { price: 44283.42462, volume: 5 },
    { price: 44283.42465, volume: 43 },
    { price: 44283.42467, volume: 25 },
  ],
};

const zoomedOutData = {
  buy: [
    { price: 0.06996, volume: 387 },
    { price: 0.06995, volume: 312 },
    { price: 0.06994, volume: 501 },
    { price: 0.06993, volume: 233 },
    { price: 0.06992, volume: 141 },
    { price: 0.06991, volume: 228 },
    { price: 0.0699, volume: 151 },
    { price: 0.06989, volume: 162 },
    { price: 0.06988, volume: 219 },
    { price: 0.06987, volume: 624 },
    { price: 0.06986, volume: 357 },
    { price: 0.06985, volume: 531 },
    { price: 0.06984, volume: 221 },
    { price: 0.06983, volume: 84 },
    { price: 0.06982, volume: 229 },
    { price: 0.06981, volume: 209 },
    { price: 0.0698, volume: 78 },
    { price: 0.06979, volume: 76 },
    { price: 0.06978, volume: 285 },
    { price: 0.06975, volume: 148 },
    { price: 0.06974, volume: 76 },
    { price: 0.06973, volume: 73 },
    { price: 0.06967, volume: 1909 },
    { price: 0.06966, volume: 1433 },
    { price: 0.06965, volume: 956 },
    { price: 0.06943, volume: 481 },
    { price: 0.06658, volume: 2 },
  ],
  sell: [
    { price: 0.06998, volume: 74 },
    { price: 0.07001, volume: 257 },
    { price: 0.07002, volume: 232 },
    { price: 0.07003, volume: 65 },
    { price: 0.07005, volume: 64 },
    { price: 0.07006, volume: 85 },
    { price: 0.07007, volume: 1174 },
    { price: 0.07008, volume: 784 },
    { price: 0.07009, volume: 417 },
    { price: 0.0701, volume: 488 },
    { price: 0.07011, volume: 498 },
    { price: 0.07012, volume: 280 },
    { price: 0.07013, volume: 157 },
    { price: 0.07014, volume: 69 },
    { price: 0.07015, volume: 215 },
    { price: 0.07016, volume: 173 },
    { price: 0.07017, volume: 317 },
    { price: 0.07019, volume: 72 },
    { price: 0.0702, volume: 74 },
    { price: 0.07022, volume: 40 },
    { price: 0.07024, volume: 74 },
    { price: 0.07047, volume: 1888 },
    { price: 0.07048, volume: 1417 },
    { price: 0.07049, volume: 945 },
    { price: 0.07057, volume: 1339 },
    { price: 0.07058, volume: 1633 },
    { price: 0.07059, volume: 226 },
    { price: 0.0706, volume: 351 },
    { price: 0.07061, volume: 218 },
    { price: 0.07062, volume: 117 },
    { price: 0.07063, volume: 1296 },
    { price: 0.07064, volume: 355 },
    { price: 0.07065, volume: 730 },
    { price: 0.07066, volume: 230 },
    { price: 0.07067, volume: 277 },
    { price: 0.07068, volume: 187 },
    { price: 0.07069, volume: 139 },
    { price: 0.0707, volume: 208 },
    { price: 0.07071, volume: 310 },
    { price: 0.07072, volume: 115 },
    { price: 0.07073, volume: 254 },
    { price: 0.07074, volume: 69 },
    { price: 0.07075, volume: 207 },
    { price: 0.07076, volume: 167 },
    { price: 0.07078, volume: 91 },
    { price: 0.07079, volume: 55 },
    { price: 0.0708, volume: 75 },
    { price: 0.07091, volume: 470 },
    { price: 0.07092, volume: 1336 },
    { price: 0.07094, volume: 152 },
    { price: 0.07095, volume: 125 },
    { price: 0.07096, volume: 134 },
    { price: 0.07097, volume: 115 },
    { price: 0.07098, volume: 57 },
    { price: 0.07099, volume: 35 },
    { price: 0.071, volume: 79 },
    { price: 0.07102, volume: 1194 },
    { price: 0.07103, volume: 169 },
    { price: 0.07104, volume: 446 },
    { price: 0.07105, volume: 230 },
    { price: 0.07106, volume: 242 },
    { price: 0.07107, volume: 125 },
    { price: 0.07108, volume: 110 },
    { price: 0.0711, volume: 167 },
    { price: 0.07111, volume: 120 },
    { price: 0.07113, volume: 58 },
    { price: 0.07114, volume: 65 },
    { price: 0.07115, volume: 53 },
    { price: 0.07117, volume: 204 },
    { price: 0.07118, volume: 144 },
    { price: 0.0712, volume: 33 },
    { price: 0.07122, volume: 152 },
    { price: 0.07124, volume: 54 },
    { price: 0.07128, volume: 33 },
    { price: 0.07492, volume: 2 },
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
  }, 1000);

  const theme = useDarkMode() ? "dark" : "light";

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
        <DepthChart ref={ref} data={data} theme={theme} />
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
        width: "80vw",
        height: "40vh",
      }}
    >
      <DepthChart ref={ref} {...args} />
    </div>
  );
};

export const AAPL = Template.bind({});
AAPL.args = {
  data: AAPL_data,
  priceFormat: (price: number) => priceFormatter(5).format(price),
};

export const ETHBTC = Template.bind({});
ETHBTC.args = {
  data: ETHBTC_data,
  priceFormat: (price: number) => priceFormatter(5).format(price),
  indicativePrice: 0.065,
};

export const UNIDAI = Template.bind({});
UNIDAI.args = {
  data: UNIDAI_data,
  priceFormat: (price: number) => priceFormatter(5).format(price),
  indicativePrice: 30,
};

export const BTCUSD = Template.bind({});
BTCUSD.args = {
  data: BTCUSD_data,
  priceFormat: (price: number) => priceFormatter(5).format(price),
  midPrice: 44256,
};

export const SinglePriceLevel = Template.bind({});
SinglePriceLevel.args = {
  data: { buy: AAPL_data.buy.slice(0, 1), sell: [] },
  priceFormat: (price: number) => priceFormatter(5).format(price),
};

export const LeftSided = Template.bind({});
LeftSided.args = {
  data: { buy: AAPL_data.buy, sell: [] },
  priceFormat: (price: number) => priceFormatter(5).format(price),
};

export const RightSided = Template.bind({});
RightSided.args = {
  data: { buy: [], sell: AAPL_data.sell },
  priceFormat: (price: number) => priceFormatter(5).format(price),
};

export const NoData = Template.bind({});
NoData.args = {
  data: { buy: [], sell: [] },
  priceFormat: (price: number) => priceFormatter(5).format(price),
};

export const InitialZoom = Template.bind({});
InitialZoom.args = {
  data: { buy: zoomedOutData.buy, sell: zoomedOutData.sell },
  priceFormat: (price: number) => priceFormatter(5).format(price),
};
