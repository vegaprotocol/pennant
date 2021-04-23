import { ScaleLinear, ScaleTime } from "d3-scale";

import { Colors } from "../helpers";
import { RenderableElement } from "../types";
import { WIDTH } from "../constants";

function addYAxisPath(
  ctx: CanvasRenderingContext2D,
  xScale: ScaleTime<number, number, never>,
  yScale: ScaleLinear<number, number, never>,
  position: [number | null, number | null],
  decimalPlaces: number
) {
  const y = position[1];

  if (y) {
    const width = xScale.range()[1];

    ctx.font = `12px monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    const value = yScale.invert(y);
    const xPad = 5;
    const text = value.toFixed(decimalPlaces);
    const rectHeight = 18;

    let yAdjusted = y;

    if (y - rectHeight / 2 < 0) {
      yAdjusted = rectHeight / 2;
    }

    if (y + rectHeight / 2 > yScale.range()[0]) {
      yAdjusted = yScale.range()[0] - rectHeight / 2;
    }

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
    ctx.fillText(text, width - WIDTH + xPad, yAdjusted);
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
    xScale: ScaleTime<number, number, never>,
    yScale: ScaleLinear<number, number, never>,
    pixelRatio: number = 1,
    position: [number | null, number | null]
  ) {
    addYAxisPath(ctx, xScale, yScale, position, this.decimalPlaces);
  }
}
