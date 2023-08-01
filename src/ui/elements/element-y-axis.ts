import { hex2rgb, string2hex } from "@ui/renderer";
import { TICK_LABEL_FONT_SIZE, Y_AXIS_WIDTH } from "@util/constants";
import { getNumYTicks } from "@util/misc";
import { RenderableElement, ScaleLinear, ScaleTime } from "@util/types";

import { Colors } from "../../feature/candlestick-chart/helpers";

const MARGIN = 6;
const FADE_HEIGHT = 6;

function addYAxisPath(
  ctx: CanvasRenderingContext2D,
  xScale: ScaleTime,
  yScale: ScaleLinear,
  pixelRatio: number,
  colors: Colors,
) {
  const xRange = xScale.range();
  const yRange = yScale.range();
  const numYTicks = getNumYTicks(yRange[1] - yRange[0]);
  const yTicks = yScale.ticks(numYTicks);
  const tickFormat = yScale.tickFormat(numYTicks);

  ctx.beginPath();
  const rgb = hex2rgb(string2hex(colors.backgroundSurface)).map((c) => 255 * c);
  ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.8)`;

  ctx.fillRect(
    xScale.range()[1] - Y_AXIS_WIDTH,
    yRange[1],
    Y_AXIS_WIDTH,
    yRange[0] - yRange[1],
  );

  ctx.closePath();

  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = colors.textSecondary;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.font = `${TICK_LABEL_FONT_SIZE}px monospace`;

  yTicks.forEach(function drawTick(tick: number) {
    ctx.beginPath();

    ctx.fillText(
      tickFormat(tick),
      xRange[1] - Y_AXIS_WIDTH + MARGIN,
      Math.round(yScale(tick)),
    );

    ctx.closePath();
  });

  const gradientTop = ctx.createLinearGradient(0, 0, 0, FADE_HEIGHT);
  gradientTop.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},1)`);
  gradientTop.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);

  ctx.fillStyle = gradientTop;
  ctx.fillRect(xRange[1] - Y_AXIS_WIDTH, 0, Y_AXIS_WIDTH, FADE_HEIGHT);

  const gradientBottom = ctx.createLinearGradient(
    0,
    yRange[0] - FADE_HEIGHT,
    0,
    yRange[0],
  );
  gradientBottom.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
  gradientBottom.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},1)`);

  ctx.fillStyle = gradientBottom;
  ctx.fillRect(
    xRange[1] - Y_AXIS_WIDTH,
    yScale.range()[0] - FADE_HEIGHT,
    Y_AXIS_WIDTH,
    FADE_HEIGHT,
  );

  ctx.beginPath();
  ctx.strokeStyle = colors.emphasis300;
  ctx.moveTo(xRange[1] - Y_AXIS_WIDTH, yRange[0]);
  ctx.lineTo(xRange[1] - Y_AXIS_WIDTH, yRange[1]);
  ctx.stroke();
  ctx.closePath();
}

export class YAxisElement implements RenderableElement {
  draw(
    ctx: CanvasRenderingContext2D,
    xScale: ScaleTime,
    yScale: ScaleLinear,
    pixelRatio = 1,
    colors: Colors,
  ) {
    addYAxisPath(ctx, xScale, yScale, pixelRatio, colors);
  }
}
