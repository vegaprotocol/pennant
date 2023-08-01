import { RenderableElement, ScaleLinear, ScaleTime } from "@util/types";

import { Colors } from "../../feature/candlestick-chart/helpers";

function addAnnotationPath(
  ctx: CanvasRenderingContext2D,
  xScale: ScaleTime,
  yScale: ScaleLinear,
  position: number | null,
  decimalPlaces: number,
  colors: Colors,
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

    ctx.fillStyle = colors.emphasis300;
    ctx.strokeStyle = colors.textPrimary;
    ctx.fill();
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    ctx.fillStyle = colors.textPrimary;
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

  draw(
    ctx: CanvasRenderingContext2D,
    xScale: ScaleTime,
    yScale: ScaleLinear,
    pixelRatio: number = 1,
    position: number | null,
    colors: Colors,
  ) {
    addAnnotationPath(
      ctx,
      xScale,
      yScale,
      this.position,
      this.decimalPlaces,
      colors,
    );
  }
}
