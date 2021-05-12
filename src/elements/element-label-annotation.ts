import { Intent, RenderableElement, ScaleLinear, ScaleTime } from "../types";
import { align, alignSpan, Colors } from "../helpers";

const HEIGHT = 10;
const PADDING = 2;

export type Cell = {
  label: string;
  stroke?: boolean;
  fill?: boolean;
  onClick?: () => void;
};

export class LabelAnnotationElement implements RenderableElement {
  readonly cells: Cell[];
  readonly intent: Intent;
  readonly y: number;

  constructor(cfg: { cells: Cell[]; intent: Intent; y: number }) {
    const { cells, intent, y } = cfg;

    this.cells = cells;
    this.intent = intent;
    this.y = y;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    xScale: ScaleTime,
    yScale: ScaleLinear,
    pixelRatio: number = 1
  ) {
    const stroke = this.intent === "success" ? Colors.GREEN : Colors.RED;
    const fill = this.intent === "success" ? Colors.GREEN : Colors.RED;

    ctx.font = `${14}px sans-serif`;
    ctx.textBaseline = "middle";
    ctx.lineWidth = 2;
    ctx.strokeStyle = stroke;

    // Dashed price line
    ctx.beginPath();
    ctx.setLineDash([2 * pixelRatio, 6 * pixelRatio]);
    ctx.moveTo(0, yScale(this.y));
    ctx.lineTo(xScale.range()[1], yScale(this.y));
    ctx.stroke();
    ctx.closePath();

    let currentWidth = 0;

    for (const cell of this.cells) {
      const { width } = ctx.measureText(cell.label);

      // Border and background
      ctx.setLineDash([]);
      ctx.strokeStyle = stroke;
      ctx.fillStyle = cell.fill ? fill : "black";

      ctx.fillRect(
        currentWidth,
        yScale(this.y) - (HEIGHT * pixelRatio) / 2,
        width + 2 * PADDING * pixelRatio,
        HEIGHT * pixelRatio
      );

      ctx.strokeRect(
        currentWidth,
        yScale(this.y) - (HEIGHT * pixelRatio) / 2,
        width + 2 * PADDING * pixelRatio,
        HEIGHT * pixelRatio
      );

      // Text
      ctx.fillStyle = cell.stroke ? stroke : cell.fill ? "black" : "white";
      ctx.fillText(
        cell.label,
        PADDING * pixelRatio + currentWidth,
        yScale(this.y)
      );

      currentWidth += width + 2 * PADDING * pixelRatio;
    }
  }
}
