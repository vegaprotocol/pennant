import { PositionalElement, ScaleLinear, ScaleTime } from "../types";
import { curveLinear, area as d3Area, line as d3Line } from "d3-shape";

import { Gradient } from "../vega-lite/mark";

export type Area = {
  points: [Date, number, number][];
  fill: string | Gradient;
  line: string | undefined;
};

export class AreaElement implements PositionalElement {
  readonly points: [Date, number, number][];
  readonly fill: string | Gradient;
  readonly line: string | undefined;

  get x() {
    return this.points[0][0];
  }

  constructor(cfg: any) {
    const { points, fill, line } = cfg;

    this.points = points;
    this.fill = fill;
    this.line = line;
  }

  draw(ctx: CanvasRenderingContext2D, xScale: ScaleTime, yScale: ScaleLinear) {
    // TODO: Instantiate on construction
    const area = d3Area<[Date, number, number]>()
      .curve(curveLinear)
      .x((d) => xScale(d[0]))
      .y0((d) => yScale(d[1]))
      .y1((d) => yScale(d[2]));

    const line = d3Line<[Date, number, number]>()
      .curve(curveLinear)
      .x((d) => xScale(d[0]))
      .y((d) => yScale(d[2]));

    let fill: string | CanvasGradient;

    if (typeof this.fill === "string") {
      fill = this.fill;
    } else {
      fill = ctx.createLinearGradient(
        0,
        yScale.range()[1],
        0,
        yScale.range()[0]
      );

      for (const stop of this.fill.stops) {
        fill.addColorStop(stop.offset, stop.color);
      }
    }

    area.context(ctx);
    line.context(ctx);

    if (this.points.length > 1) {
      ctx.beginPath();

      area(this.points);

      ctx.fillStyle = fill;
      ctx.globalAlpha = 0.7;
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.closePath();

      if (this.line) {
        ctx.beginPath();

        line(this.points);

        ctx.lineWidth = 2;
        ctx.strokeStyle = this.line;
        ctx.stroke();

        ctx.closePath();
      }
    }
  }
}
