import { align, getNumXTicks, getNumYTicks } from "@util/misc";

import { ScaleLinear, ScaleTime } from "../../types";
import { RenderableElement } from "../../types";

function addGridPath(
  ctx: CanvasRenderingContext2D,
  xScale: ScaleTime,
  yScale: ScaleLinear,
  pixelRatio: number = 1,
  color: string
) {
  const xRange = xScale.range().map(Math.round);
  const yRange = yScale.range().map(Math.round);

  const numXTicks = getNumXTicks(xRange[1] - xRange[0]);
  const numYTicks = getNumYTicks(yRange[1] - yRange[0]);

  const xTicks = xScale.ticks(numXTicks);
  const yTicks = yScale.ticks(numYTicks);

  for (const tick of xTicks) {
    ctx.save();
    ctx.beginPath();

    ctx.strokeStyle = color;
    ctx.fillStyle = "transparent";
    ctx.lineWidth = 1 / pixelRatio;

    ctx.moveTo(align(xScale(tick)!, pixelRatio), yRange[0]);
    ctx.lineTo(align(xScale(tick)!, pixelRatio), yRange[1]);

    ctx.fill();
    ctx.stroke();

    ctx.closePath();
    ctx.restore();
  }

  for (const tick of yTicks) {
    ctx.save();
    ctx.beginPath();

    ctx.strokeStyle = color;
    ctx.fillStyle = "transparent";
    ctx.lineWidth = 1 / pixelRatio;

    ctx.moveTo(xRange[0], align(yScale(tick)!, pixelRatio));
    ctx.lineTo(xRange[1], align(yScale(tick)!, pixelRatio));

    ctx.fill();
    ctx.stroke();

    ctx.closePath();
    ctx.restore();
  }
}

export class GridElement implements RenderableElement {
  draw(
    ctx: CanvasRenderingContext2D,
    xScale: ScaleTime,
    yScale: ScaleLinear,
    pixelRatio: number = 1,
    color: string
  ) {
    addGridPath(ctx, xScale, yScale, pixelRatio, color);
  }
}
