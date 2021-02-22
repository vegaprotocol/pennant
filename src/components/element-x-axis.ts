import { Colors } from "../lib/vega-colours";
import { Element } from "../types/element";

export function addXAxisPath(ctx: CanvasRenderingContext2D, xScale: any) {
  ctx.strokeStyle = "#fff";

  const tickFormat = xScale.tickFormat();

  const xRange = xScale.range();
  const numXTicks = (xRange[1] - xRange[0]) / 60;
  const xTicks = xScale.ticks(numXTicks);

  xTicks.forEach((tick: number) => {
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
  draw(ctx: CanvasRenderingContext2D, xScale: any, yScale: any) {
    addXAxisPath(ctx, xScale);
  }
}
