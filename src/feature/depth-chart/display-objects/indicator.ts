import { Container, Graphics } from "@ui/renderer";

/**
 * Draw an indicator at a given price and volume
 */
export class Indicator extends Container {
  private circle: Graphics = new Graphics();
  private line: Graphics = new Graphics();
  private color: number;

  constructor(color = 0xffffff) {
    super();

    this.color = color;

    this.circle.beginFill(color);
    this.circle.drawCircle(0, 0, 4);
    this.circle.endFill();

    this.addChild(this.line);
    this.addChild(this.circle);

    this.visible = false;
  }

  public update(x: number, y: number, width: number) {
    this.circle.x = x;
    this.circle.y = y;

    this.line.clear();

    this.line.lineStyle({
      width: 1,
      color: this.color,
      lineDash: [3, 3],
    });

    this.line.moveTo(x, 0);
    this.line.lineTo(x, y);
    this.line.lineTo(width / 2, y);
    this.line.endFill();
  }
}
