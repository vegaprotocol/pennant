import { dateFormat } from "@util/misc";
import {
  Interval,
  RenderableElement,
  ScaleLinear,
  ScaleTime,
} from "@util/types";

import { Colors } from "../../feature/candlestick-chart/helpers";

function addXAxisTooltipPath(
  ctx: CanvasRenderingContext2D,
  xScale: ScaleTime,
  pixelRatio: number,
  position: Date | null,
  interval: Interval,
  colors: Colors,
) {
  if (position) {
    const x = xScale(position);
    const height = 24.5;

    ctx.font = `${12}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const value = xScale.invert(x);
    const xPad = 5;
    const text = dateFormat(value, interval);
    const textWidth = ctx.measureText(text ?? "").width;
    const rectWidth = textWidth + xPad * 2;
    const rectHeight = 19;

    let xAdjusted = x;

    if (x - rectWidth / 2 < 0) {
      xAdjusted = rectWidth / 2;
    }

    if (x + rectWidth / 2 > xScale.range()[1]) {
      xAdjusted = xScale.range()[1] - rectWidth / 2;
    }

    ctx.beginPath();
    ctx.moveTo(x, height - rectHeight - 5);
    ctx.lineTo(x + 5, height - rectHeight);
    ctx.lineTo(xAdjusted + rectWidth / 2, height - rectHeight);
    ctx.lineTo(xAdjusted + rectWidth / 2, height);
    ctx.lineTo(xAdjusted - rectWidth / 2, height);
    ctx.lineTo(xAdjusted - rectWidth / 2, height - rectHeight);
    ctx.lineTo(x - 5, height - rectHeight);
    ctx.closePath();

    ctx.fillStyle = colors.backgroundSurface;
    ctx.strokeStyle = colors.emphasis300;
    ctx.fill();
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    ctx.fillStyle = colors.textPrimary;
    ctx.fillText(text ?? "", xAdjusted, height - rectHeight / 2);
    ctx.closePath();
  }
}

export class XAxisTooltipElement implements RenderableElement {
  draw(
    ctx: CanvasRenderingContext2D,
    xScale: ScaleTime,
    _yScale: ScaleLinear,
    pixelRatio: number = 1,
    position: Date | null,
    interval: Interval,
    colors: Colors,
  ) {
    addXAxisTooltipPath(ctx, xScale, pixelRatio, position, interval, colors);
  }
}
