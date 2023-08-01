import { SHAPES } from "../const";
import { Rectangle } from "./rectangle";

export class Circle {
  public x: number;
  public y: number;
  public radius: number;
  public readonly type: SHAPES.CIRCLE;

  constructor(x = 0, y = 0, radius = 0) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.type = SHAPES.CIRCLE;
  }

  clone(): Circle {
    return new Circle(this.x, this.y, this.radius);
  }

  contains(x: number, y: number): boolean {
    if (this.radius <= 0) {
      return false;
    }

    const r2 = this.radius * this.radius;
    let dx = this.x - x;
    let dy = this.y - y;

    dx *= dx;
    dy *= dy;

    return dx + dy <= r2;
  }

  getBounds(): Rectangle {
    return new Rectangle(
      this.x - this.radius,
      this.y - this.radius,
      this.radius * 2,
      this.radius * 2,
    );
  }
}
