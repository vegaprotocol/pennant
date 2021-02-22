import { Colors } from "../lib/vega-colours";
import { Element } from "../types/element";

export function addCrosshairPath(
  ctx: CanvasRenderingContext2D,
  xScale: any,
  yScale: any,
  x: any,
  y: any
) {
  const xRange = xScale.range().map(Math.round);
  const yRange = yScale.range().map(Math.round);

  ctx.save();

  // Lines
  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = Colors.GRAY_LIGHT;
  ctx.beginPath();
  ctx.moveTo(Math.round(x) + 0.5, yRange[0]);
  ctx.lineTo(Math.round(x) + 0.5, yRange[1]);
  ctx.stroke();
  ctx.closePath();

  ctx.beginPath();
  ctx.moveTo(xRange[0], Math.round(y) + 0.5);
  ctx.lineTo(xRange[1], Math.round(y) + 0.5);
  ctx.stroke();
  ctx.closePath();

  ctx.restore();
}

export class CrosshairElement implements Element {
  draw(
    ctx: CanvasRenderingContext2D,
    xScale: any,
    yScale: any,
    x: number,
    y: number
  ) {
    addCrosshairPath(ctx, xScale, yScale, x, y);
  }
}
