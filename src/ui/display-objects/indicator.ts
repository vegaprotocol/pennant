import { Container, Graphics } from "@ui/renderer";

/**
 * Draw an indicator at a given price and volume
 */
export class Indicator extends Container {
  private innerCircle: Graphics = new Graphics();
  private outerCircle: Graphics = new Graphics();
  private color: number;

  constructor(color = 0xffffff) {
    super();

    this.color = color;

    this.outerCircle.beginFill(0xffffff);
    this.outerCircle.drawCircle(0, 0, 12);
    this.outerCircle.endFill();

    this.innerCircle.beginFill(color);
    this.innerCircle.drawCircle(0, 0, 8);
    this.innerCircle.endFill();

    this.addChild(this.outerCircle);
    this.addChild(this.innerCircle);

    this.visible = false;
  }

  public update(x: number, y: number, color: number) {
    this.outerCircle.x = x;
    this.outerCircle.y = y;

    this.innerCircle.x = x;
    this.innerCircle.y = y;

    if (this.color !== color) {
      this.color = color;

      this.innerCircle.clear();
      this.innerCircle.beginFill(color);
      this.innerCircle.drawCircle(0, 0, 8);
      this.innerCircle.endFill();
    }
  }
}
