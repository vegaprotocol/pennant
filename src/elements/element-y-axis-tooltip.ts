import { ScaleLinear, ScaleTime } from "../types";
import { TICK_LABEL_FONT_SIZE, WIDTH } from "../constants";

import { align, Colors } from "../helpers";
import { RenderableElement } from "../types";
import { formatter } from "../helpers";

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

    const value = yScale.invert(position); // FIXME: Surely better to pass in a value in the domain to avoid any conversion errors
    const xPad = 5 + 2 / pixelRatio;
    const text = formatter(value, decimalPlaces);
    const rectHeight = 18;

    let yAdjusted = position;

    if (position - rectHeight / 2 < 0) {
      yAdjusted = rectHeight / 2;
    }

    if (position + rectHeight / 2 > yScale.range()[0]) {
      yAdjusted = yScale.range()[0] - rectHeight / 2;
    }

    ctx.beginPath();
    ctx.moveTo(width - WIDTH - 10, yAdjusted);
    ctx.lineTo(width - WIDTH, align(yAdjusted - rectHeight / 2, pixelRatio));
    ctx.lineTo(
      align(width, pixelRatio),
      align(yAdjusted - rectHeight / 2, pixelRatio)
    );
    ctx.lineTo(
      align(width, pixelRatio),
      align(yAdjusted + rectHeight / 2, pixelRatio)
    );
    ctx.lineTo(width - WIDTH, align(yAdjusted + rectHeight / 2, pixelRatio));
    ctx.closePath();

    ctx.fillStyle = Colors.GRAY_DARK_1;
    ctx.strokeStyle = Colors.GRAY_LIGHT_1;
    ctx.lineWidth = 1 / pixelRatio;
    ctx.fill();
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    ctx.fillStyle = Colors.WHITE;
    ctx.fillText(text, align(width - WIDTH + xPad, pixelRatio), yAdjusted);
    ctx.closePath();
  }
}

export class YAxisTooltipElement implements RenderableElement {
  readonly decimalPlaces: number;

  constructor(decimalPlaces: number) {
    this.decimalPlaces = decimalPlaces;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    xScale: ScaleTime,
    yScale: ScaleLinear,
    pixelRatio: number = 1,
    position: number | null
  ) {
    addYAxisPath(ctx, xScale, yScale, pixelRatio, position, this.decimalPlaces);
  }
}
