import { PositionalElement, ScaleLinear, ScaleTime } from "@util/types";
import { curveLinear, line as d3Line } from "d3-shape";

export type Line = {
  points: [Date, number][];
  color: string;
};

export class LineElement implements PositionalElement {
  readonly points: [Date, number][];
  readonly color: string;

  // TODO: Make curve interploation configurable
  lineGenerator = d3Line<[Date, number]>().curve(curveLinear);

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
    pixelRatio: number = 1,
  ) {
    this.lineGenerator.x((d) => xScale(d[0])).y((d) => yScale(d[1]));

    this.lineGenerator.context(ctx);

    if (this.points.length > 1) {
      ctx.beginPath();

      this.lineGenerator(this.points);

      ctx.strokeStyle = this.color;
      ctx.lineCap = "butt";
      ctx.lineWidth = 2 / pixelRatio;
      ctx.stroke();

      ctx.closePath();
    }
  }
}
