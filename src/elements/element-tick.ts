import { PositionalElement, ScaleLinear, ScaleTime } from "../types";
import { align } from "../helpers";

export class TickElement implements PositionalElement {
  readonly x: Date;
  readonly y: number;
  readonly width: number;
  readonly color: string;
  readonly orient: "left" | "right";

  constructor(cfg: any) {
    const { x, y, width, color, orient } = cfg;

    this.x = x;
    this.y = y;
    this.width = width;
    this.color = color;
    this.orient = orient;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    xScale: ScaleTime,
    yScale: ScaleLinear,
    pixelRatio: number = 1
  ) {
    ctx.beginPath();

    ctx.moveTo(
      align(
        xScale(
          this.x.getTime() - (this.orient === "left" ? this.width / 2 : 0)
        ),
        pixelRatio
      ),
      align(yScale(this.y), pixelRatio)
    );

    ctx.lineTo(
      align(
        xScale(
          this.x.getTime() + (this.orient === "right" ? this.width / 2 : 0)
        ),
        pixelRatio
      ),
      align(yScale(this.y), pixelRatio)
    );

    ctx.strokeStyle = this.color;
    ctx.lineCap = "butt";
    ctx.lineWidth = 2 / pixelRatio;
    ctx.stroke();
    ctx.closePath();
  }
}
