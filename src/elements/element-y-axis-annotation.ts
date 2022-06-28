import { Colors } from "../components/chart/helpers";
import { TICK_LABEL_FONT_SIZE, Y_AXIS_WIDTH } from "../constants";
import { align, formatter } from "../helpers";
import { RenderableElement, ScaleLinear, ScaleTime } from "../types";

function addYAxisPath(
  ctx: CanvasRenderingContext2D,
  xScale: ScaleTime,
  yScale: ScaleLinear,
  position: number | null,
  decimalPlaces: number,
  colors: Colors
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

    ctx.save();

    ctx.setLineDash([2, 2]);
    ctx.strokeStyle = colors.textSecondary;

    ctx.beginPath();
    ctx.moveTo(xScale.range()[0], align(y) + 0.5);
    ctx.lineTo(xScale.range()[1], align(y) + 0.5);
    ctx.stroke();
    ctx.closePath();

    ctx.restore();

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
    pixelRatio: number = 1,
    position: number | null,
    colors: Colors
  ) {
    addYAxisPath(
      ctx,
      xScale,
      yScale,
      this.position,
      this.decimalPlaces,
      colors
    );
  }
}
