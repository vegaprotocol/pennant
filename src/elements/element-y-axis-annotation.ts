import { RenderableElement, ScaleLinear, ScaleTime } from "../types";
import { TICK_LABEL_FONT_SIZE, WIDTH } from "../constants";

import { align, Colors } from "../helpers";

function addYAxisPath(
  ctx: CanvasRenderingContext2D,
  xScale: ScaleTime,
  yScale: ScaleLinear,
  pixelRatio: number,
  position: number | null,
  decimalPlaces: number
) {
  if (position) {
    const width = xScale.range()[1];

    ctx.font = `${TICK_LABEL_FONT_SIZE}px monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    const value = position;
    const xPad = 5;
    const text = value.toFixed(decimalPlaces);
    const rectHeight = 18;

    let yAdjusted = yScale(position);

    ctx.save();

    ctx.setLineDash([2, 2]);
    ctx.strokeStyle = Colors.GRAY_LIGHT;

    ctx.beginPath();
    ctx.moveTo(xScale.range()[0], Math.round(yScale(position)) + 0.5);
    ctx.lineTo(xScale.range()[1], Math.round(yScale(position)) + 0.5);
    ctx.stroke();
    ctx.closePath();

    ctx.restore();

    ctx.beginPath();
    ctx.moveTo(width - WIDTH - 10, yAdjusted);
    ctx.lineTo(width - WIDTH, yAdjusted - rectHeight / 2);
    ctx.lineTo(width, yAdjusted - rectHeight / 2);
    ctx.lineTo(width, yAdjusted + rectHeight / 2);
    ctx.lineTo(width - WIDTH, yAdjusted + rectHeight / 2);
    ctx.closePath();

    ctx.fillStyle = Colors.GRAY_DARK_1;
    ctx.strokeStyle = Colors.GRAY_LIGHT_1;
    ctx.fill();
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    ctx.fillStyle = Colors.WHITE;
    ctx.fillText(text, align(width - WIDTH + xPad, pixelRatio), yAdjusted);
    ctx.closePath();
  }
}

export class YAxisAnnotationElement implements RenderableElement {
  readonly decimalPlaces: number;
  readonly position: number;

  constructor(position: number, decimalPlaces: number) {
    this.position = position;
    this.decimalPlaces = decimalPlaces;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    xScale: ScaleTime,
    yScale: ScaleLinear,
    pixelRatio: number = 1
  ) {
    addYAxisPath(
      ctx,
      xScale,
      yScale,
      pixelRatio,
      this.position,
      this.decimalPlaces
    );
  }
}
