import { ScaleLinear, ScaleTime } from "d3-scale";

import { Colors } from "../lib/vega-colours";
import { Element } from "../types/element";

export type Bar = {
  x: Date;
  width: number;
  height: number;
};

export class BarElement implements Element {
  readonly x: Date;
  readonly width: number;
  readonly height: number;

  constructor(bar: Bar) {
    const { x, width, height } = bar;

    this.x = x;
    this.width = width;
    this.height = height;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    xScale: ScaleTime<number, number, never>,
    yScale: ScaleLinear<number, number, never>
  ) {
    ctx.save();
    ctx.beginPath();

    ctx.rect(
      xScale(this.x.getTime() - this.width / 2),
      yScale(this.height),
      xScale(this.width) - xScale(0),
      Math.abs(yScale(this.height) - yScale(0))
    );

    ctx.fillStyle = Colors.GRAY;
    ctx.fill();
    ctx.restore();
  }
}
