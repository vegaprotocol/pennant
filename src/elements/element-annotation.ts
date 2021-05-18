import { Colors } from "../helpers";
import { RenderableElement, ScaleLinear, ScaleTime } from "../types";

function addAnnotationPath(
  ctx: CanvasRenderingContext2D,
  xScale: ScaleTime,
  yScale: ScaleLinear,
  position: number | null,
  decimalPlaces: number
) {
  if (position) {
    ctx.beginPath();
    ctx.moveTo(xScale.range()[0], Math.round(yScale(position)) + 0.5);
    ctx.lineTo(xScale.range()[1], Math.round(yScale(position)) + 0.5);
    ctx.stroke();
    ctx.closePath();

    const width = xScale.range()[1];

    ctx.font = `12px monospace`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    const value = position;
    const xPad = 5;
    const text = value.toFixed(decimalPlaces);
    const textWidth = ctx.measureText(text).width;
    const rectWidth = textWidth + xPad;
    const rectHeight = 18;

    let yAdjusted = yScale(position);

    if (yScale(position) - rectHeight / 2 < 0) {
      yAdjusted = rectHeight / 2;
    }

    if (yScale(position) + rectHeight / 2 > yScale.range()[0]) {
      yAdjusted = yScale.range()[0] - rectHeight / 2;
    }

    ctx.beginPath();
    ctx.moveTo(width - rectWidth - 10, yAdjusted);
    ctx.lineTo(width - rectWidth, yAdjusted - rectHeight / 2);
    ctx.lineTo(width, yAdjusted - rectHeight / 2);
    ctx.lineTo(width, yAdjusted + rectHeight / 2);
    ctx.lineTo(width - rectWidth, yAdjusted + rectHeight / 2);
    ctx.closePath();

    ctx.fillStyle = Colors.GRAY_DARK_1;
    ctx.strokeStyle = "white";
    ctx.fill();
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    ctx.fillStyle = Colors.WHITE;
    ctx.fillText(text, width - xPad, yAdjusted);
    ctx.closePath();
  }
}

export class AnnotationElement implements RenderableElement {
  readonly decimalPlaces: number;
  readonly position: number | null;

  constructor(decimalPlaces: number, position: number | null) {
    this.decimalPlaces = decimalPlaces;
    this.position = position;
  }

  draw(ctx: CanvasRenderingContext2D, xScale: ScaleTime, yScale: ScaleLinear) {
    addAnnotationPath(ctx, xScale, yScale, this.position, this.decimalPlaces);
  }
}
