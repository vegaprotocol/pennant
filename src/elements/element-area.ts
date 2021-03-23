import { ScaleLinear, ScaleTime } from "d3-scale";
import { curveBasis, area as d3Area } from "d3-shape";

import { PositionalElement } from "../types";

export type Area = {
  points: [Date, number][];
  color: string;
};

export class AreaElement implements PositionalElement {
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
    const area = d3Area<[number, number]>()
      .curve(curveBasis)
      //.x((d) => xScale(d[0]))
      .y0(yScale(0));
    //.y1((d) => yScale(d[1]));

    area.context(ctx);

    // No x values provided, draw full width of chart
    if (this.points.length === 2 && this.points[0][0] === null) {
      const simplePoints: [number, number][] = [
        [xScale.range()[0], yScale(this.points[0][1])],
        [xScale.range()[1], yScale(this.points[1][1])],
      ];

      ctx.beginPath();

      area(simplePoints);

      ctx.strokeStyle = this.color;
      ctx.stroke();
      ctx.fillStyle = "rgba(255,0,0,0.5)";
      ctx.fill();
      ctx.closePath();
    }

    if (this.points.length > 1) {
      ctx.beginPath();

      const simplePoints: [number, number][] = this.points.map((point) => [
        xScale(point[0]),
        yScale(point[1]),
      ]);

      area(simplePoints);

      ctx.strokeStyle = this.color;
      ctx.stroke();
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.closePath();
    }
  }
}
