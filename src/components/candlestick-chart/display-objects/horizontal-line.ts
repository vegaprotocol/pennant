import { Graphics } from "../../../renderer/graphics";

/**
 * Draws a horizontal line
 */
export class HorizontalLine extends Graphics {
  private width: number;
  private color: number;
  private lineDash: number[];

  constructor(width = 1, color = 0xffffff, lineDash: number[] = []) {
    super();

    this.width = width;
    this.color = color;
    this.lineDash = lineDash;
  }

  public update(y: number, width: number, resolution: number = 1) {
    this.clear();
    this.lineStyle({
      width: this.width,
      color: this.color,
      lineDash: this.lineDash.map((value) => value * resolution),
    });
    this.moveTo(0, 0.5);
    this.lineTo(width, 0.5);
    this.endFill();
    this.y = y;
  }
}
