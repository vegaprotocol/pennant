import { TICK_LABEL_FONT, TICK_LABEL_FONT_SIZE } from "@util/constants";
import { getNumXTicks, tickFormat } from "@util/misc";
import {
  Interval,
  RenderableElement,
  ScaleLinear,
  ScaleTime,
} from "@util/types";

function addXAxisPath(
  ctx: CanvasRenderingContext2D,
  xScale: ScaleTime,
  pixelRatio: number,
  interval: Interval,
  color: string,
) {
  ctx.strokeStyle = "#fff";

  const xRange = xScale.range();
  const numXTicks = getNumXTicks(xRange[1] - xRange[0]);
  const xTicks = xScale.ticks(numXTicks);
  const xTickLabels = tickFormat(xTicks, interval);

  for (let i = 0; i < xTicks.length; i++) {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.textBaseline = "top";
    ctx.textAlign = "center";
    ctx.font = `${TICK_LABEL_FONT_SIZE}px ${TICK_LABEL_FONT}`;
    ctx.fillText(xTickLabels?.[i] ?? "", xScale(xTicks[i]), 9);
    ctx.closePath();
  }
}

export class XAxisElement implements RenderableElement {
  draw(
    ctx: CanvasRenderingContext2D,
    xScale: ScaleTime,
    _yScale: ScaleLinear,
    pixelRatio = 1,
    interval: Interval,
    color: string,
  ) {
    addXAxisPath(ctx, xScale, pixelRatio, interval, color);
  }
}
