import { ScaleLinear, ScaleTime } from "d3-scale";

import { RenderableElement } from "../types";

export class DummyElement implements RenderableElement {
  readonly x: Date;

  constructor(cfg: any) {
    const { x } = cfg;

    this.x = x;
  }

  draw(
    _ctx: CanvasRenderingContext2D,
    _xScale: ScaleTime<number, number, never>,
    _yScale: ScaleLinear<number, number, never>
  ) {}
}
