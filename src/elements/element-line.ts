import { ScaleLinear, ScaleTime } from "d3-scale";
import { curveLinear, line as d3Line } from "d3-shape";

import { PositionalElement } from "../types";

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
    // TODO: Instantiate on construction
    const line = d3Line<[Date, number]>()
      .curve(curveLinear)
      .x((d) => xScale(d[0]))
      .y((d) => yScale(d[1]));

    line.context(ctx);

    if (this.points.length > 1) {
      ctx.beginPath();

      line(this.points);

      ctx.strokeStyle = this.color;
      ctx.stroke();

      ctx.closePath();
    }
  }
}
