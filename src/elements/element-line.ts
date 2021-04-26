import { PositionalElement, ScaleLinear, ScaleTime } from "../types";
import { align, alignSpan } from "../helpers";
import { curveLinear, line as d3Line } from "d3-shape";

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
    xScale: ScaleTime,
    yScale: ScaleLinear,
    pixelRatio: number = 1
  ) {
    // TODO: Instantiate on construction
    const line = d3Line<[Date, number]>()
      .curve(curveLinear)
      .x((d) => align(xScale(d[0]), pixelRatio))
      .y((d) => alignSpan(yScale(d[1]), pixelRatio));

    line.context(ctx);

    if (this.points.length > 1) {
      ctx.beginPath();

      line(this.points);

      ctx.strokeStyle = this.color;
      ctx.lineCap = "butt";
      ctx.lineWidth = 1 / pixelRatio;
      ctx.stroke();

      ctx.closePath();
    }
  }
}
