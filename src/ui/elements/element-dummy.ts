import * as types from "@util/types";

export class DummyElement implements types.RenderableElement {
  readonly x: Date;

  constructor(cfg: any) {
    const { x } = cfg;

    this.x = x;
  }

  draw(
    _ctx: CanvasRenderingContext2D,
    _xScale: types.ScaleTime,
    _yScale: types.ScaleLinear,
  ) {}
}
