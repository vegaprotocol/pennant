import { ScaleLinear, ScaleTime } from "d3-scale";

import { Colors } from "../helpers";
import { RenderableElement } from "../types";

function addCrosshairPath(
  ctx: CanvasRenderingContext2D,
  xScale: ScaleTime<number, number, never>,
  yScale: ScaleLinear<number, number, never>,
  position: [number | null, number | null]
) {
  const x = position[0];
  const y = position[1];

  const xRange = xScale.range().map(Math.round);
  const yRange = yScale.range().map(Math.round);

  ctx.save();

  ctx.setLineDash([4, 6]);
  ctx.strokeStyle = Colors.GRAY_LIGHT_1;

  if (x) {
    ctx.beginPath();
    ctx.moveTo(Math.round(x), yRange[0]);
    ctx.lineTo(Math.round(x), yRange[1]);
    ctx.stroke();
    ctx.closePath();
  }

  if (y) {
    ctx.beginPath();
    ctx.moveTo(xRange[0], Math.round(y));
    ctx.lineTo(xRange[1], Math.round(y));
    ctx.stroke();
    ctx.closePath();
  }

  ctx.restore();
}

export class CrosshairElement implements RenderableElement {
  draw(
    ctx: CanvasRenderingContext2D,
    xScale: ScaleTime<number, number, never>,
    yScale: ScaleLinear<number, number, never>,
    pixelRatio: number = 1,
    position: [number | null, number | null]
  ) {
    addCrosshairPath(ctx, xScale, yScale, position);
  }
}
