import {
  LabelAnnotation,
  RenderableElement,
  ScaleLinear,
  ScaleTime,
} from "../types";
import { Colors } from "../helpers";
import { sum, zip } from "d3-array";

const HEIGHT = 18;
const PADDING = 4;

export function cumsum(values: number[]) {
  let sum = 0;
  return Array.from(values, (v) => (sum += v || 0));
}

export type Cell = {
  label: string;
  stroke?: boolean;
  fill?: boolean;
  onClick?: () => void;
};

function addLabel(
  ctx: CanvasRenderingContext2D,
  xScale: ScaleTime,
  yScale: ScaleLinear,
  pixelRatio: number,
  label: LabelAnnotation,
  y: number
) {
  const stroke = label.intent === "success" ? Colors.GREEN : Colors.RED;
  const fill = label.intent === "success" ? Colors.GREEN : Colors.RED;

  ctx.font = `${14}px sans-serif`;
  ctx.textBaseline = "middle";
  ctx.lineWidth = 2;
  ctx.strokeStyle = stroke;

  // Calculate widths of cells
  const widths = label.cells.map(
    (cell) => ctx.measureText(cell.label).width + 2 * PADDING
  );

  const xPositions = [0, ...cumsum(widths).slice(0, -1)];
  const totalWidth = sum(widths);

  // Dashed price line
  ctx.beginPath();
  ctx.setLineDash([2 * pixelRatio, 3 * pixelRatio]);
  ctx.moveTo(totalWidth, y);
  ctx.lineTo(Math.max(xScale.range()[1] / 2, totalWidth), yScale(label.y));
  ctx.lineTo(xScale.range()[1], yScale(label.y));
  ctx.stroke();
  ctx.closePath();

  for (const element of zip<any>(label.cells, widths, xPositions)) {
    const cell = element[0] as Cell;
    const width = element[1] as number;
    const xPosition = element[2] as number;

    // Border and background
    ctx.setLineDash([]);
    ctx.strokeStyle = stroke;
    ctx.fillStyle = cell.fill ? fill : "black";

    ctx.fillRect(xPosition + 1, y - HEIGHT / 2 - 1, width, HEIGHT);

    ctx.strokeRect(xPosition + 1, y - HEIGHT / 2 - 1, width, HEIGHT);

    // Text
    ctx.fillStyle = cell.stroke ? stroke : cell.fill ? "black" : "white";
    ctx.fillText(cell.label, PADDING + xPosition, y);
  }
}

export class LabelAnnotationElement implements RenderableElement {
  readonly labels: LabelAnnotation[];

  constructor(cfg: { labels: LabelAnnotation[] }) {
    const { labels } = cfg;

    this.labels = [...labels].sort((a, b) => b.y - a.y);
  }

  draw(
    ctx: CanvasRenderingContext2D,
    xScale: ScaleTime,
    yScale: ScaleLinear,
    pixelRatio: number = 1
  ) {
    let previousY = -HEIGHT;

    const yPositions = this.labels.map((label) => yScale(label.y));
    const sortedYPositions = [...yPositions].sort((a, b) => a - b);
    const shiftedYPositions = sortedYPositions.reduce<number[]>((p, y) => {
      const ypx = y;

      let ny = ypx;

      if (ypx - previousY < HEIGHT) {
        ny = previousY + HEIGHT;
      }

      p.push(ny);

      previousY = ny || ypx;

      return p;
    }, []);

    for (const label of zip<any>(this.labels, shiftedYPositions)) {
      addLabel(
        ctx,
        xScale,
        yScale,
        pixelRatio,
        label[0] as LabelAnnotation,
        label[1] as number
      );
    }
  }
}
