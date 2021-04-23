import { Colors, align, alignSpan } from "../helpers";
import { ScaleLinear, ScaleTime } from "d3-scale";

import { PositionalElement } from "../types";

export type Bar = {
  x: Date;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
};

export class BarElement implements PositionalElement {
  readonly x: Date;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly fill: string;
  readonly stroke: string;

  constructor(cfg: any) {
    const { x, y, width, height, fill, stroke } = cfg;

    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.fill = fill;
    this.stroke = stroke;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    xScale: ScaleTime<number, number, never>,
    yScale: ScaleLinear<number, number, never>,
    pixelRatio: number = 1
  ) {
    ctx.beginPath();

    const pixelWidth = xScale(this.width) - xScale(0);

    if (pixelWidth < 1) {
      return;
    }

    ctx.rect(
      align(xScale(this.x.getTime() - this.width / 2), pixelRatio),
      align(yScale(this.y), pixelRatio),
      alignSpan(pixelWidth, pixelRatio),
      alignSpan(Math.abs(yScale(this.height) - yScale(0)), pixelRatio)
    );

    ctx.fillStyle = this.fill ?? Colors.GRAY;
    ctx.fill();

    if (this.stroke) {
      ctx.lineWidth = 1 / pixelRatio;
      ctx.strokeStyle = this.stroke ?? Colors.GRAY;
      ctx.stroke();
    }
  }
}
