import { ScaleLinear, ScaleTime } from "d3-scale";

import { PositionalElement } from "../types/element";

export type Line = {
  points: [Date, number][];
  color: string;
};

export class LineElement implements PositionalElement {
  readonly points: [Date, number][];
  readonly color: string;

  get x() {
    return this.points[0][0];
  }

  constructor(cfg: any) {
    const { points, color } = cfg;

    this.points = points;
    this.color = color;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    xScale: ScaleTime<number, number, never>,
    yScale: ScaleLinear<number, number, never>
  ) {
    ctx.save();

    if (this.points.length > 1) {
      ctx.beginPath();

      ctx.moveTo(xScale(this.points[0][0]), yScale(this.points[0][1]));

      for (let i = 1; i < this.points.length; i++) {
        ctx.lineTo(xScale(this.points[i][0]), yScale(this.points[i][1]));
      }

      ctx.strokeStyle = this.color;
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }
}
