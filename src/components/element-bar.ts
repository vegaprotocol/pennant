import { Colors } from "../lib/vega-colours";

interface Element {
  draw(ctx: CanvasRenderingContext2D, xScale: any, yScale: any): void;
}

export class BarElement implements Element {
  readonly x: number;
  readonly width: number;
  readonly height: number;

  constructor(bar: any) {
    const { x, width, height } = bar;

    this.x = x;
    this.width = width;
    this.height = height;
  }

  draw(ctx: CanvasRenderingContext2D, xScale: any, yScale: any) {
    ctx.save();
    ctx.beginPath();

    ctx.rect(
      xScale(this.x - this.width / 2),
      yScale(this.height),
      xScale(this.width) - xScale(0),
      Math.abs(yScale(this.height) - yScale(0))
    );

    ctx.fillStyle = Colors.GRAY;
    ctx.fill();
    ctx.restore();
  }
}
