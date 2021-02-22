import { ScaleLinear, ScaleTime } from "d3-scale";

import { Colors } from "../helpers";
import { Element } from "../types/element";

function addXAxisPath(
  ctx: CanvasRenderingContext2D,
  xScale: ScaleTime<number, number, never>
) {
  ctx.strokeStyle = "#fff";

  const tickFormat = xScale.tickFormat();

  const xRange = xScale.range();
  const numXTicks = (xRange[1] - xRange[0]) / 60;
  const xTicks = xScale.ticks(numXTicks);

  xTicks.forEach((tick) => {
    ctx.beginPath();
    ctx.fillStyle = Colors.GRAY_LIGHT;
    ctx.textBaseline = "top";
    ctx.textAlign = "center";
    ctx.font = `12px monospace`;
    ctx.fillText(tickFormat(tick), xScale(tick), 9);
    ctx.closePath();
  });
}

export class XAxisElement implements Element {
  draw(
    ctx: CanvasRenderingContext2D,
    xScale: ScaleTime<number, number, never>,
    _yScale: ScaleLinear<number, number, never>
  ) {
    addXAxisPath(ctx, xScale);
  }
}
