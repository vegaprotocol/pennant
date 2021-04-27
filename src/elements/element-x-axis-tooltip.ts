import { ScaleLinear, ScaleTime } from "../types";

import { Colors, multiFormat } from "../helpers";
import { RenderableElement } from "../types";
import { format } from "date-fns";

function addXAxisTooltipPath(
  ctx: CanvasRenderingContext2D,
  xScale: ScaleTime,
  position: number | null
) {
  if (position) {
    const height = 24.5;

    ctx.font = `${12}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const value = xScale.invert(position);
    const xPad = 5;
    const text = multiFormat(value);
    const textWidth = ctx.measureText(text).width;
    const rectWidth = textWidth + xPad * 2;
    const rectHeight = 19;

    let xAdjusted = position;

    if (position - rectWidth / 2 < 0) {
      xAdjusted = rectWidth / 2;
    }

    if (position + rectWidth / 2 > xScale.range()[1]) {
      xAdjusted = xScale.range()[1] - rectWidth / 2;
    }

    ctx.beginPath();
    ctx.moveTo(position, height - rectHeight - 5);
    ctx.lineTo(position + 5, height - rectHeight);
    ctx.lineTo(xAdjusted + rectWidth / 2, height - rectHeight);
    ctx.lineTo(xAdjusted + rectWidth / 2, height);
    ctx.lineTo(xAdjusted - rectWidth / 2, height);
    ctx.lineTo(xAdjusted - rectWidth / 2, height - rectHeight);
    ctx.lineTo(position - 5, height - rectHeight);
    ctx.closePath();

    ctx.fillStyle = Colors.GRAY_DARK_1;
    ctx.strokeStyle = Colors.GRAY_LIGHT_1;
    ctx.fill();
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    ctx.fillStyle = Colors.WHITE;
    ctx.fillText(text, xAdjusted, height - rectHeight / 2);
    ctx.closePath();
  }
}

export class XAxisTooltipElement implements RenderableElement {
  draw(
    ctx: CanvasRenderingContext2D,
    xScale: ScaleTime,
    _yScale: ScaleLinear,
    pixelRatio: number = 1,
    position: number | null
  ) {
    addXAxisTooltipPath(ctx, xScale, position);
  }
}
