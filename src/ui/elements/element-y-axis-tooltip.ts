import { TICK_LABEL_FONT_SIZE, Y_AXIS_WIDTH } from "@util/constants";
import { formatter } from "@util/misc";
import { RenderableElement, ScaleLinear, ScaleTime } from "@util/types";

import { Colors } from "../../feature/candlestick-chart/helpers";

function addYAxisPath(
  ctx: CanvasRenderingContext2D,
  xScale: ScaleTime,
  yScale: ScaleLinear,
  position: number | null,
  decimalPlaces: number,
  colors: Colors,
) {
  if (position) {
    const width = xScale.range()[1];

    ctx.font = `${TICK_LABEL_FONT_SIZE}px monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    const xPad = 5;
    const text = formatter(position, decimalPlaces);
    const rectHeight = 18;

    let y = yScale(position);

    ctx.beginPath();
    ctx.moveTo(width - Y_AXIS_WIDTH - 10, y);
    ctx.lineTo(width - Y_AXIS_WIDTH, y - rectHeight / 2);
    ctx.lineTo(width, y - rectHeight / 2);
    ctx.lineTo(width, y + rectHeight / 2);
    ctx.lineTo(width - Y_AXIS_WIDTH, y + rectHeight / 2);
    ctx.closePath();

    ctx.fillStyle = colors.backgroundSurface;
    ctx.strokeStyle = colors.emphasis300;
    ctx.fill();
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    ctx.fillStyle = colors.textPrimary;
    ctx.fillText(text, width - Y_AXIS_WIDTH + xPad, y);
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
    position: number | null,
    colors: Colors,
  ) {
    addYAxisPath(ctx, xScale, yScale, position, this.decimalPlaces, colors);
  }
}
