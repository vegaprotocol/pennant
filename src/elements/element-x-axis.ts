import { ScaleLinear, ScaleTime } from "d3-scale";

import { Colors } from "../helpers";
import { RenderableElement } from "../types/element";
import { getNumXTicks } from "../helpers/helpers-axis";

function addXAxisPath(
  ctx: CanvasRenderingContext2D,
  xScale: ScaleTime<number, number, never>
) {
  ctx.strokeStyle = "#fff";

  const tickFormat = xScale.tickFormat();

  const xRange = xScale.range();
  const numXTicks = getNumXTicks(xRange[1] - xRange[0]);
  const xTicks = xScale.ticks(numXTicks);

  xTicks.forEach(function drawTick(tick) {
    ctx.beginPath();
    ctx.fillStyle = Colors.GRAY_LIGHT;
    ctx.textBaseline = "top";
    ctx.textAlign = "center";
    ctx.font = `12px monospace`;
    ctx.fillText(tickFormat(tick), xScale(tick), 9);
    ctx.closePath();
  });
}

export class XAxisElement implements RenderableElement {
  draw(
    ctx: CanvasRenderingContext2D,
    xScale: ScaleTime<number, number, never>,
    _yScale: ScaleLinear<number, number, never>
  ) {
    addXAxisPath(ctx, xScale);
  }
}
