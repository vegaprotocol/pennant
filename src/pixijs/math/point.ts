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
   * @returns A clone of this point
   */
  clone(): Point {
    return new Point(this.x, this.y);
  }

  /**
   * Copies `x` and `y` from the given point into this point
   *
   * @param p - The point to copy from
   * @returns The point instance itself
   */
  copyFrom(p: PointData): this {
    this.set(p.x, p.y);

    return this;
  }

  /**
   * Copies this point's x and y into the given point (`p`).
   *
   * @param p - The point to copy to. Can be any of type that is or extends `IPointData`
   * @returns The point (`p`) with values updated
   */
  copyTo<T extends Point>(p: T): T {
    p.set(this.x, this.y);

    return p;
  }

  /**
   * Accepts another point (`p`) and returns `true` if the given point is equal to this point
   *
   * @param p - The point to check
   * @returns Returns `true` if both `x` and `y` are equal
   */
  equals(p: PointData): boolean {
    return p.x === this.x && p.y === this.y;
  }

  /**
   * Sets the point to a new `x` and `y` position.
   * If `y` is omitted, both `x` and `y` will be set to `x`.
   *
   * @param x - position of the point on the `x` axis
   * @param y - position of the point on the `y` axis
   * @returns The point instance itself
   */
  set(x = 0, y = x): this {
    this.x = x;
    this.y = y;

    return this;
  }
}
