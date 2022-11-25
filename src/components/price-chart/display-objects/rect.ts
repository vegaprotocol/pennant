import { Graphics } from "../../../renderer/graphics";

/**
 * Draw a rectangle
 */
export class Rect extends Graphics {
  private alpha = 1;
  private color = 0xffffff;

  constructor(color = 0xffffff, alpha = 1) {
    super();

    this.color = color;
    this.alpha = alpha;
  }

  public update(
    x: number,
    y: number,
    width: number,
    height: number,
    color: number
  ) {
    this.clear();
    this.beginFill(color, this.alpha);
    this.drawRect(x, y, width, height);
    this.endFill();
  }
}
