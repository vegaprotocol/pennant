import { ScaleLinear, ScaleTime } from "d3-scale";

import { Colors } from "../helpers";
import { RenderableElement } from "../types/element";
import { WIDTH } from "../constants";

const MARGIN = 6;

function addYAxisPath(
  ctx: CanvasRenderingContext2D,
  xScale: ScaleTime<number, number, never>,
  yScale: ScaleLinear<number, number, never>
) {
  const xRange = xScale.range();
  const yRange = yScale.range();
  const numYTicks = Math.abs(yRange[1] - yRange[0]) / 60;
  const yTicks = yScale.ticks(numYTicks);
  const tickFormat = yScale.tickFormat(numYTicks);

  ctx.beginPath();
  ctx.fillStyle = "rgba(0,0,0,0.6)";

  ctx.fillRect(
    xScale.range()[1] - WIDTH,
    yRange[1],
    WIDTH,
    yRange[0] - yRange[1]
  );

  ctx.closePath();

  ctx.beginPath();
  ctx.strokeStyle = Colors.GRAY_LIGHT;
  ctx.moveTo(xRange[1] - WIDTH, yRange[0]);
  ctx.lineTo(xRange[1] - WIDTH, yRange[1]);
  ctx.stroke();
  ctx.closePath();

  ctx.strokeStyle = "#fff";
  ctx.fillStyle = Colors.GRAY_LIGHT;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.font = `12px monospace`;

  yTicks.forEach((tick: number) => {
    ctx.beginPath();

    ctx.fillText(
      tickFormat(tick),
      xRange[1] - WIDTH + MARGIN,
      Math.round(yScale(tick))
    );

    ctx.closePath();
  });
}

export class YAxisElement implements RenderableElement {
  draw(
    ctx: CanvasRenderingContext2D,
    xScale: ScaleTime<number, number, never>,
    yScale: ScaleLinear<number, number, never>
  ) {
    addYAxisPath(ctx, xScale, yScale);
  }
}
