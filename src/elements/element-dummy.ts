import { RenderableElement, ScaleLinear, ScaleTime } from "../types";

export class DummyElement implements RenderableElement {
  readonly x: Date;

  constructor(cfg: any) {
    const { x } = cfg;

    this.x = x;
  }

  draw(
    _ctx: CanvasRenderingContext2D,
    _xScale: ScaleTime,
    _yScale: ScaleLinear
  ) {}
}
