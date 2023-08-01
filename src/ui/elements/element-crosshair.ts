import * as types from "@util/types";

function addCrosshairPath(
  ctx: CanvasRenderingContext2D,
  xScale: types.ScaleTime,
  yScale: types.ScaleLinear,
  position: [Date | null, number | null],
  color: string,
) {
  const x = position[0];
  const y = position[1];

  const xRange = xScale.range().map(Math.round);
  const yRange = yScale.range().map(Math.round);

  ctx.save();

  ctx.setLineDash([4, 6]);
  ctx.lineWidth = 1;
  ctx.strokeStyle = color;

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

export class CrosshairElement implements types.RenderableElement {
  draw(
    ctx: CanvasRenderingContext2D,
    xScale: types.ScaleTime,
    yScale: types.ScaleLinear,
    pixelRatio: number = 1,
    position: [Date | null, number | null],
    color: string,
  ) {
    addCrosshairPath(ctx, xScale, yScale, position, color);
  }
}
