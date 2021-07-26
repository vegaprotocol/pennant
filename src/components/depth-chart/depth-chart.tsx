import { bisect, max, min, zip } from "d3-array";
import { scaleLinear } from "d3-scale";
import { curveStepBefore, line } from "d3-shape";
import { orderBy } from "lodash";
import { useEffect, useRef } from "react";

import { cumsum } from "../../elements";
import { Renderer } from "../../pixijs/core";
import { Container } from "../../pixijs/display";
import { Graphics } from "../../pixijs/graphics";
import { Rectangle } from "../../pixijs/math";

const WIDTH = 800;
const HEIGHT = 600;

export type PriceLevel = {
  price: number;
  volume: number;
};

export type DepthChartProps = {
  buy: PriceLevel[];
  sell: PriceLevel[];
};

export const DepthChart = ({ buy, sell }: DepthChartProps) => {
  const ref = useRef<HTMLCanvasElement>(null!);

  const cumulativeBuy = zip<number>(
    buy.map((priceLevel) => priceLevel.price),
    cumsum(buy.map((priceLevel) => priceLevel.volume))
  ) as [number, number][];

  const cumulativeSell = zip<number>(
    sell.map((priceLevel) => priceLevel.price),
    cumsum(sell.map((priceLevel) => priceLevel.volume))
  ) as [number, number][];

  const prices = orderBy([
    ...buy.map((priceLevel) => priceLevel.price),
    ...sell.map((priceLevel) => priceLevel.price),
  ]);

  const midPrice = (buy[0].price + sell[0].price) / 2;

  console.log(midPrice);

  const maxPriceDifference =
    max(prices.map((price) => Math.abs(price - midPrice))) ?? 0;

  const priceExtent: [number, number] = [
    midPrice - maxPriceDifference,
    midPrice + maxPriceDifference,
  ];

  const volumes = orderBy([...cumulativeBuy, ...cumulativeSell], ["0"]).map(
    (priceLevel) => priceLevel[1]
  );

  const volumeExtent: [number, number] = [0, max(volumes) ?? 0];

  const priceScale = scaleLinear().domain(priceExtent).range([0, WIDTH]);
  const volumeScale = scaleLinear().domain(volumeExtent).range([HEIGHT, 0]);

  useEffect(() => {
    const stage = new Container();

    const sellLine = new Graphics();
    sellLine.visible = false;
    sellLine.beginFill(0xde3249);
    sellLine.drawRect(0, 0, 1, HEIGHT);
    sellLine.endFill();

    const sellArea = new Graphics();
    sellArea.visible = false;
    sellArea.beginFill(0xde3249);
    sellArea.drawRect(0, 0, 1, HEIGHT);
    sellArea.endFill();

    const buyPriceLine = new Graphics();
    buyPriceLine.visible = false;
    buyPriceLine.beginFill(0xde3249);
    buyPriceLine.drawRect(0, 0, 1, HEIGHT);
    buyPriceLine.endFill();

    const buyArea = new Graphics();
    buyArea.visible = false;
    buyArea.beginFill(0xde3249);
    buyArea.drawRect(0, 0, 1, HEIGHT);
    buyArea.endFill();

    const buyVolumeLine = new Graphics();
    buyVolumeLine.visible = false;
    buyVolumeLine.beginFill(0xde3249);
    buyVolumeLine.drawRect(0, 0, WIDTH / 2, 1);
    buyVolumeLine.endFill();

    const buyPriceText = new Text("Basic text in pennant", {
      fill: "white",
      fontSize: 24,
      align: "left",
    });

    stage.interactive = true;
    stage.hitArea = new Rectangle(0, 0, WIDTH, HEIGHT);
    stage
      .on("pointermove", (event) => {
        let x = event.data.global.x;

        const index = bisect(prices, priceScale.invert(x));
        const nearestX = priceScale(prices[index]);

        if (x > WIDTH / 2) {
          x = WIDTH - x;
        }

        sellArea.visible = true;
        sellLine.visible = true;
        buyArea.visible = true;
        buyPriceLine.visible = true;
        buyVolumeLine.visible = true;

        sellArea.clear();
        sellArea.beginFill(0xde3249, 0.3);
        sellArea.drawRect(WIDTH - nearestX, 0, nearestX, 600);
        sellArea.endFill();
        sellLine.x = WIDTH - nearestX;

        buyArea.clear();
        buyArea.beginFill(0x00aa00, 0.3);
        buyArea.drawRect(0, 0, nearestX, 600);
        buyArea.endFill();
        buyPriceLine.x = nearestX;
        buyVolumeLine.y = volumeScale(volumes[index]);

        requestAnimationFrame(() => renderer.render(stage));
      })
      .on("pointerout", (event) => {
        sellArea.visible = false;
        sellLine.visible = false;
        buyArea.visible = false;
        buyPriceLine.visible = false;
        buyVolumeLine.visible = false;

        requestAnimationFrame(() => renderer.render(stage));
      });

    const renderer = new Renderer({
      resolution: 1,
      view: ref.current,
    });

    const buyCurve = new Graphics();

    buyCurve.lineStyle({ width: 5, color: 0xaa0000 });
    buyCurve.drawLine(
      cumulativeBuy.map((point) => [
        priceScale(point[0]),
        volumeScale(point[1]),
      ]),
      curveStepBefore
    );

    const sellCurve = new Graphics();

    sellCurve.lineStyle({ width: 2, color: 0x00aa00 });
    sellCurve.drawLine(
      cumulativeSell.map((point) => [
        priceScale(point[0]),
        volumeScale(point[1]),
      ]),
      curveStepBefore
    );

    stage.addChild(buyCurve);
    stage.addChild(sellCurve);

    stage.addChild(sellArea);
    stage.addChild(sellLine);
    stage.addChild(buyArea);
    stage.addChild(buyPriceLine);
    stage.addChild(buyVolumeLine);

    renderer.render(stage);
  }, [cumulativeBuy, cumulativeSell, priceScale, prices, volumeScale, volumes]);

  const l = line()
    .x((d) => priceScale(d[0]))
    .y((d) => volumeScale(d[1]));

  return (
    <div>
      <canvas
        ref={ref}
        width={WIDTH}
        height={HEIGHT}
        style={{
          width: `${WIDTH}px`,
          height: `${HEIGHT}px`,
          backgroundColor: "black",
        }}
      />
    </div>
  );
};

DepthChart.displayName = "DepthChart";
