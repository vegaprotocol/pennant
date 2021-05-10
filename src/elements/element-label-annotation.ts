import { RenderableElement, ScaleLinear, ScaleTime } from "../types";
import { align, alignSpan } from "../helpers";

export class LabelAnnotationElement implements RenderableElement {
  readonly y: number;

  constructor(cfg: any) {
    const { y } = cfg;

    this.y = y;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    xScale: ScaleTime,
    yScale: ScaleLinear,
    pixelRatio: number = 1
  ) {
    ctx.font = "18px sans-serif";
    ctx.fillStyle = "white";
    ctx.fillText("Position", 0, yScale(this.y));

    const { width } = ctx.measureText("Position");

    ctx.fillText("33,684.11", width, yScale(this.y));

    ctx.strokeStyle = "red";
    ctx.lineCap = "butt";
    ctx.lineWidth = 2 / pixelRatio;
    ctx.stroke();
  }
}
