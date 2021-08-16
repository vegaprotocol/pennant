export interface PointData {
  x: number;
  y: number;
}

export class Point {
  /** Position of the point on the x axis */
  public x = 0;

  /** Position of the point on the y axis */
  public y = 0;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  /** Creates a clone of this point
   */
  clone(): Point {
    return new Point(this.x, this.y);
  }

  /**
   * Copies `x` and `y` from the given point into this point
   */
  copyFrom(p: PointData): this {
    this.set(p.x, p.y);

    return this;
  }

  /**
   * Copies this point's x and y into the given point (`p`).
   */
  copyTo<T extends Point>(p: T): T {
    p.set(this.x, this.y);

    return p;
  }

  /**
   * Accepts another point (`p`) and returns `true` if the given point is equal to this point
   */
  equals(p: PointData): boolean {
    return p.x === this.x && p.y === this.y;
  }

  /**
   * Sets the point to a new `x` and `y` position.
   * If `y` is omitted, both `x` and `y` will be set to `x`. */
  set(x = 0, y = x): this {
    this.x = x;
    this.y = y;

    return this;
  }
}
