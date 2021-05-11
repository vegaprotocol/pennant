import { Intent, RenderableElement, ScaleLinear, ScaleTime } from "../types";
import { align, alignSpan, Colors } from "../helpers";

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

  constructor(cfg: any) {
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

    ctx.font = "28px sans-serif";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 2 * pixelRatio;

    let currentWidth = 0;

    for (const cell of this.cells) {
      const { width } = ctx.measureText(cell.label);

      // Border and background
      ctx.strokeStyle = stroke;
      ctx.fillStyle = cell.fill ? fill : "black";
      ctx.fillRect(
        currentWidth,
        yScale(this.y) - 22,
        width + 8 * pixelRatio,
        44
      );
      ctx.strokeRect(
        currentWidth,
        yScale(this.y) - 22,
        width + 8 * pixelRatio,
        44
      );

      // Text
      ctx.fillStyle = cell.stroke ? stroke : cell.fill ? "black" : "white";
      ctx.fillText(cell.label, 4 * pixelRatio + currentWidth, yScale(this.y));

      currentWidth += width + 8 * pixelRatio;
    }
  }
}
