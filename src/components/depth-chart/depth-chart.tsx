import { Slider } from "@blueprintjs/core";
import { extent, max, zip } from "d3-array";
import { scaleLinear } from "d3-scale";
import { orderBy } from "lodash";
import { useEffect, useRef, useState } from "react";
import useResizeObserver from "use-resize-observer";

import { cumsum } from "../../elements";
import { useInterval } from "../../hooks";
import { Axis } from "./axis";
import { Chart } from "./chart";
import styles from "./depth-chart.module.css";

// TODO: Do not recreate scenegraph whenever dimensions change
// TODO: Check parent is being set on display objects (seems to always be null)
export const AXIS_HEIGHT = 20;

export const FILL_BUY = 0x070c07;
export const FILL_BUY_LIGHT = 0x121f11;
export const STROKE_BUY = 0x243e22;
export const STROKE_BUY_LIGHT = 0x5a9c55;

export const FILL_SELL = 0x110508;
export const FILL_SELL_LIGHT = 0x2b0d13;
export const STROKE_SELL = 0x571924;
export const STROKE_SELL_LIGHT = 0xda3f5b;

export const GRAY = 0x303030;

const priceFormatter = new Intl.NumberFormat("en-gb", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

const volumeFormatter = new Intl.NumberFormat("en-gb", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});

export type PriceLevel = {
  price: number;
  volume: number;
};

export type DepthChartProps = {
  buy: PriceLevel[];
  sell: PriceLevel[];
};

export const DepthChart = ({ buy, sell }: DepthChartProps) => {
  const chartRef = useRef<HTMLCanvasElement>(null!);
  const axisRef = useRef<HTMLCanvasElement>(null!);

  const chart = useRef<Chart>(null!);
  const axis = useRef<Axis>(null!);

  const {
    ref,
    width = 800,
    height = 600,
  } = useResizeObserver<HTMLDivElement>();

  const [data, setData] = useState({ buy, sell });
  const [span, setSpan] = useState(1);

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
    }

    fecthData();
  }, 10000);

  const cumulativeBuy = zip<number>(
    data.buy.map((priceLevel) => priceLevel.price),
    cumsum(data.buy.map((priceLevel) => priceLevel.volume))
  ) as [number, number][];

  const cumulativeSell = zip<number>(
    data.sell.map((priceLevel) => priceLevel.price),
    cumsum(data.sell.map((priceLevel) => priceLevel.volume))
  ) as [number, number][];

  const prices = orderBy([
    ...data.buy.map((priceLevel) => priceLevel.price),
    ...data.sell.map((priceLevel) => priceLevel.price),
  ]);

  const midPrice = (data.buy[0].price + data.sell[0].price) / 2;

  const maxPriceDifference =
    max(prices.map((price) => Math.abs(price - midPrice))) ?? 0;

  const priceExtent: [number, number] = [
    midPrice - span * maxPriceDifference,
    midPrice + span * maxPriceDifference,
  ];

  const indexExtent = extent(
    orderBy([...data.buy, ...data.sell], ["price"])
      .map((priceLevel, index) => ({ ...priceLevel, index }))
      .filter(
        (priceLevel) =>
          priceLevel.price >= priceExtent[0] &&
          priceLevel.price <= priceExtent[1]
      )
      .map((priceLevel) => priceLevel.index)
  );

  const volumes = orderBy([...cumulativeBuy, ...cumulativeSell], ["0"]).map(
    (priceLevel) => priceLevel[1]
  );

  const volumeExtent: [number, number] = [
    0,
    2 * (max(volumes.slice(indexExtent[0], indexExtent[1])) ?? 0),
  ];

  const priceScale = scaleLinear().domain(priceExtent).range([0, width]);

  const volumeScale = scaleLinear()
    .domain(volumeExtent)
    .range([height - AXIS_HEIGHT, 0]);

  useEffect(() => {
    chart.current = new Chart({
      view: chartRef.current,
      resolution: 1.5,
      width,
      height,
    });

    axis.current = new Axis({
      view: axisRef.current,
      resolution: 1.5,
      width,
      height,
    });

    return () => {
      axis.current.destroy();
    };
  }, [height, width]);

  useEffect(() => {
    axis.current.update(
      prices.map((price) => priceScale(price)),
      volumes.map((volume) => volumeScale(volume)),
      prices.map((price) => priceFormatter.format(price)),
      volumes.map((volume) => volumeFormatter.format(volume)),
      priceScale
    );

    axis.current.render();
  }, [priceScale, prices, volumeScale, volumes]);

  useEffect(() => {
    const extendedCumulativeBuy = [
      ...cumulativeBuy,
      [
        midPrice - maxPriceDifference,
        cumulativeBuy[cumulativeBuy.length - 1][1],
      ],
    ] as [number, number][];

    chart.current.update(
      extendedCumulativeBuy.map((point) => [
        priceScale(point[0]),
        volumeScale(point[1]),
      ]),
      cumulativeSell.map((point) => [
        priceScale(point[0]),
        volumeScale(point[1]),
      ])
    );

    chart.current.render();
  }, [
    cumulativeBuy,
    cumulativeSell,
    maxPriceDifference,
    midPrice,
    priceScale,
    prices,
    volumeScale,
    volumes,
  ]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        height: "100%",
      }}
    >
      <div
        ref={ref}
        className={styles.canvasContainer}
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <canvas
          ref={chartRef}
          className={styles.canvas}
          style={{
            backgroundColor: "#0f0f0f",
          }}
        />
        <canvas ref={axisRef} className={styles.canvas} />
      </div>
      <div
        style={{
          height: `${height}px`,
          paddingLeft: "12px",
          paddingRight: "24px",
        }}
      >
        <Slider
          min={0.01}
          max={1}
          stepSize={0.01}
          labelRenderer={(value) =>
            Intl.NumberFormat("en-gb", {
              style: "percent",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(value)
          }
          vertical
          showTrackFill={false}
          value={span}
          onChange={(value) => {
            setSpan(value);
          }}
        />
      </div>
    </div>
  );
};

DepthChart.displayName = "DepthChart";
