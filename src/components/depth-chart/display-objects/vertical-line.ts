import { Graphics } from "../../../renderer/graphics";
import { AXIS_HEIGHT } from "../depth-chart";

export class VerticalLine extends Graphics {
  public width: number;
  public color: number;
  public lineDash: number[];

  constructor(width = 1, color = 0xffffff, lineDash: number[] = []) {
    super();

    this.width = width;
    this.color = color;
    this.lineDash = lineDash;
  }

  public update(x: number, height: number) {
    this.clear();
    this.lineStyle({
      width: this.width,
      color: this.color,
      lineDash: this.lineDash,
    });
    this.moveTo(0, 0);
    this.lineTo(0, height - AXIS_HEIGHT);
    this.endFill();
    this.x = x;
  }
}
