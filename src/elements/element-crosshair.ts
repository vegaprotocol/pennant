import { RenderableElement, ScaleLinear, ScaleTime } from "../types";

import { Colors } from "../helpers";

function addCrosshairPath(
  ctx: CanvasRenderingContext2D,
  xScale: ScaleTime,
  yScale: ScaleLinear,
  position: [Date | null, number | null]
) {
  const x = position[0];
  const y = position[1];

  const xRange = xScale.range().map(Math.round);
  const yRange = yScale.range().map(Math.round);

  ctx.save();

  ctx.setLineDash([4, 6]);
  ctx.lineWidth = 1;
  ctx.strokeStyle = Colors.WHITE;

  if (x) {
    ctx.beginPath();
    ctx.moveTo(Math.round(xScale(x)), yRange[0]);
    ctx.lineTo(Math.round(xScale(x)), yRange[1]);
    ctx.stroke();
    ctx.closePath();
  }

  if (y) {
    ctx.beginPath();
    ctx.moveTo(xRange[0], Math.round(yScale(y)));
    ctx.lineTo(xRange[1], Math.round(yScale(y)));
    ctx.stroke();
    ctx.closePath();
  }

  ctx.restore();
}

export class CrosshairElement implements RenderableElement {
  draw(
    ctx: CanvasRenderingContext2D,
    xScale: ScaleTime,
    yScale: ScaleLinear,
    pixelRatio: number = 1,
    position: [Date | null, number | null]
  ) {
    addCrosshairPath(ctx, xScale, yScale, position);
  }
}
