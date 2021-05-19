import { Shapes } from "..";

/**
 * Rectangle object is an area defined by its position, as indicated by its top-left corner
 * point (x, y) and by its width and its height.
 */
export class Rectangle {
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public readonly type: Shapes.Rectangle;

  /**
   * @param x - The X coordinate of the upper-left corner of the rectangle
   * @param y - The Y coordinate of the upper-left corner of the rectangle
   * @param width - The overall width of this rectangle
   * @param height - The overall height of this rectangle
   */
  constructor(x = 0, y = 0, width = 0, height = 0) {
    this.x = x;
    this.y = x;
    this.width = width;
    this.height = height;
    this.type = Shapes.Rectangle;
  }

  /**
   * returns the left edge of the rectangle
   */
  get left(): number {
    return this.x;
  }

  /**
   * returns the right edge of the rectangle
   */
  get right(): number {
    return this.x + this.width;
  }

  /**
   * returns the top edge of the rectangle
   */
  get top(): number {
    return this.y;
  }

  /**
   * returns the bottom edge of the rectangle
   */
  get bottom(): number {
    return this.y + this.height;
  }

  /**
   * Checks whether the x and y coordinates given are contained within this Rectangle
   *
   * @param x - The X coordinate of the point to test
   * @param y - The Y coordinate of the point to test
   * @return Whether the x/y coordinates are within this Rectangle
   */
  contains(x: number, y: number): boolean {
    if (this.width <= 0 || this.height <= 0) {
      return false;
    }

    if (x >= this.x && x < this.x + this.width) {
      if (y >= this.y && y < this.y + this.height) {
        return true;
      }
    }

    return false;
  }
}
