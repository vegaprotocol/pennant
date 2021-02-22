import { ScaleLinear, ScaleTime } from "d3-scale";

export interface Element {
  draw(
    ctx: CanvasRenderingContext2D,
    xScale: ScaleTime<number, number, never>,
    yScale: ScaleLinear<number, number, never>,
    ...rest: any[]
  ): void;
}
