import { Colors } from "../lib/vega-colours";
import { Element } from "../types/element";

export function addYAxisPath(
  ctx: CanvasRenderingContext2D,
  xScale: any,
  yScale: any
) {
  ctx.strokeStyle = "#fff";

  const yRange = yScale.range();
  const numYTicks = Math.abs(yRange[1] - yRange[0]) / 60;
  const yTicks = yScale.ticks(numYTicks);

  yTicks.forEach((tick: number) => {
    const text = tick.toString();
    const textWidth = ctx.measureText(text).width;

    ctx.beginPath();
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(
      xScale.range()[1] - textWidth - 10,
      yScale(tick) - 10,
      textWidth + 10,
      20
    );
    ctx.closePath();

    ctx.beginPath();
    ctx.fillStyle = Colors.GRAY_LIGHT;
    ctx.textBaseline = "middle";
    ctx.textAlign = "right";
    ctx.font = `12px monospace`;
    ctx.fillText(
      String(Math.round(tick)),
      xScale.range()[1] - 5,
      Math.round(yScale(tick))
    );
    ctx.closePath();
  });
}

export class YAxisElement implements Element {
  draw(ctx: CanvasRenderingContext2D, xScale: any, yScale: any) {
    addYAxisPath(ctx, xScale, yScale);
  }
}
