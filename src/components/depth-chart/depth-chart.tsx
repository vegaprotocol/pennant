import { max, min, zip } from "d3-array";
import { scaleLinear } from "d3-scale";
import { line } from "d3-shape";

import { cumsum } from "../../elements";

const WIDTH = 400;
const HEIGHT = 100;

export type PriceLevel = {
  price: number;
  volume: number;
};

export type DepthChartProps = {
  buy: PriceLevel[];
  sell: PriceLevel[];
};

export const DepthChart = ({ buy, sell }: DepthChartProps) => {
  const cumulativeBuy = zip<number>(
    buy.map((priceLevel) => priceLevel.price),
    cumsum(buy.map((priceLevel) => priceLevel.volume))
  ) as [number, number][];

  const cumulativeSell = zip<number>(
    sell.map((priceLevel) => priceLevel.price),
    cumsum(sell.map((priceLevel) => priceLevel.volume))
  ) as [number, number][];

  const prices = [
    ...buy.map((priceLevel) => priceLevel.price),
    ...sell.map((priceLevel) => priceLevel.price),
  ];

  const priceExtent: [number, number] = [min(prices) ?? 0, max(prices) ?? 0];

  const volumes = [
    ...cumulativeBuy.map((priceLevel) => priceLevel[1]),
    ...cumulativeSell.map((priceLevel) => priceLevel[1]),
  ];

  const volumeExtent: [number, number] = [0, max(volumes) ?? 0];

  const priceScale = scaleLinear().domain(priceExtent).range([0, WIDTH]);
  const volumeScale = scaleLinear().domain(volumeExtent).range([HEIGHT, 0]);

  const l = line()
    .x((d) => priceScale(d[0]))
    .y((d) => volumeScale(d[1]));

  return (
    <div>
      <svg
        width={WIDTH}
        height={HEIGHT}
        style={{ width: `${WIDTH}px`, height: `${HEIGHT}px` }}
      >
        <path
          d={l(cumulativeBuy) as string}
          stroke="green"
          strokeWidth={2}
          fill="none"
        />
        <path
          d={l(cumulativeSell) as string}
          stroke="red"
          strokeWidth={2}
          fill="none"
        />
      </svg>
    </div>
  );
};

DepthChart.displayName = "DepthChart";
