import { TICK_LABEL_FONT, TICK_LABEL_FONT_SIZE } from "../constants";
import { Colors, dateFormat } from "../helpers";
import { getNumXTicks } from "../helpers/helpers-axis";
import { Interval, RenderableElement, ScaleLinear, ScaleTime } from "../types";

function addXAxisPath(
  ctx: CanvasRenderingContext2D,
  xScale: ScaleTime,
  pixelRatio: number,
  interval: Interval
) {
  ctx.strokeStyle = "#fff";

  const xRange = xScale.range();
  const numXTicks = getNumXTicks(xRange[1] - xRange[0]);
  const xTicks = xScale.ticks(numXTicks);

  xTicks.forEach(function drawTick(tick) {
    ctx.beginPath();
    ctx.fillStyle = Colors.GRAY_LIGHT;
    ctx.textBaseline = "top";
    ctx.textAlign = "center";
    ctx.font = `${TICK_LABEL_FONT_SIZE}px ${TICK_LABEL_FONT}`;
    ctx.fillText(dateFormat(tick, interval), xScale(tick), 9);
    ctx.closePath();
  });
}

export class XAxisElement implements RenderableElement {
  draw(
    ctx: CanvasRenderingContext2D,
    xScale: ScaleTime,
    _yScale: ScaleLinear,
    pixelRatio = 1,
    interval: Interval
  ) {
    addXAxisPath(ctx, xScale, pixelRatio, interval);
  }
}
