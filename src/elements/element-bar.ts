import { ScaleLinear, ScaleTime } from "d3-scale";

import { Colors } from "../helpers";
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
  readonly y: Date;
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
    yScale: ScaleLinear<number, number, never>
  ) {
    ctx.beginPath();

    ctx.rect(
      xScale(this.x.getTime() - this.width / 2),
      yScale(this.y),
      xScale(this.width) - xScale(0),
      Math.abs(yScale(this.height) - yScale(0))
    );

    ctx.fillStyle = this.fill ?? Colors.GRAY;
    ctx.strokeStyle = this.stroke ?? Colors.GRAY;
    ctx.fill();
    ctx.stroke();
  }
}
