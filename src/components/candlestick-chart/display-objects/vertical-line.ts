import { Graphics } from "../../../renderer/graphics";

/**
 * Draw a vertical line
 */
export class VerticalLine extends Graphics {
  private width: number;
  private color: number;
  private lineDash: number[];

  constructor(width = 1, color = 0xffffff, lineDash: number[] = []) {
    super();

    this.width = width;
    this.color = color;
    this.lineDash = lineDash;
  }

  public update(x: number, height: number, resolution: number = 1) {
    this.clear();
    this.lineStyle({
      width: this.width,
      color: 0xffffff,
      lineDash: this.lineDash.map((value) => value * resolution),
    });
    this.moveTo(0.5, 0);
    this.lineTo(0.5, height);
    this.endFill();
    this.x = Math.floor(x);
  }
}
