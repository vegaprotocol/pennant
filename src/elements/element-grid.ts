import { ScaleLinear, ScaleTime } from "d3-scale";

import { Colors } from "../helpers/helpers-color";
import { Element } from "../types/element";

function addGridPath(
  ctx: CanvasRenderingContext2D,
  xScale: ScaleTime<number, number, never>,
  yScale: ScaleLinear<number, number, never>
) {
  const xRange = xScale.range().map(Math.round);
  const yRange = yScale.range().map(Math.round);

  const numXTicks = (xRange[1] - xRange[0]) / 50;
  const numYTicks = Math.abs(yRange[1] - yRange[0]) / 50;

  const xTicks = xScale.ticks(numXTicks);
  const yTicks = yScale.ticks(numYTicks);

  for (const tick of xTicks) {
    ctx.save();
    ctx.beginPath();

    ctx.strokeStyle = Colors.GRAY;
    ctx.fillStyle = "transparent";
    ctx.lineWidth = 0.7;

    ctx.moveTo(Math.round(xScale(tick)), yRange[0]);
    ctx.lineTo(Math.round(xScale(tick)), yRange[1]);

    ctx.fill();
    ctx.stroke();

    ctx.closePath();
    ctx.restore();
  }

  for (const tick of yTicks) {
    ctx.save();
    ctx.beginPath();

    ctx.strokeStyle = Colors.GRAY;
    ctx.fillStyle = "transparent";
    ctx.lineWidth = 1;

    ctx.moveTo(xRange[0], Math.round(yScale(tick)) + 0.5);
    ctx.lineTo(xRange[1], Math.round(yScale(tick)) + 0.5);

    ctx.fill();
    ctx.stroke();

    ctx.closePath();
    ctx.restore();
  }
}

export class GridElement implements Element {
  draw(
    ctx: CanvasRenderingContext2D,
    xScale: ScaleTime<number, number, never>,
    yScale: ScaleLinear<number, number, never>
  ) {
    addGridPath(ctx, xScale, yScale);
  }
}
