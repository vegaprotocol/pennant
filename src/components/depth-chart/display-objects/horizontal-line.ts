import { Graphics } from "../../../renderer/graphics";

export class HorizontalLine extends Graphics {
  public width: number;
  public color: number;
  public lineDash: number[];

  constructor(width = 1, color = 0xffffff, lineDash: number[] = []) {
    super();

    this.width = width;
    this.color = color;
    this.lineDash = lineDash;
  }

  public update(y: number, width: number) {
    this.clear();
    this.lineStyle({
      width: this.width,
      color: this.color,
      lineDash: this.lineDash,
    });
    this.moveTo(0, 0);
    this.lineTo(width, 0);
    this.endFill();
    this.y = y;
  }
}
