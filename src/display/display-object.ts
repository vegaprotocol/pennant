import { CanvasRenderer } from "../renderer";

export class Point {
  public x: number;
  public y: number;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  /**
   * Copies x and y from the given point (`p`)
   *
   * @param p - The point to copy from.
   * @returns The point instance itself
   */
  copyFrom(p: Point): this {
    if (this.x !== p.x || this.y !== p.y) {
      this.x = p.x;
      this.y = p.y;
    }

    return this;
  }
}

export class Transform {
  public position: Point;
  public scale: Point;

  constructor() {
    this.position = new Point(0, 0);
    this.scale = new Point(1, 1);
  }
}

/**
 * The base class for all objects that are rendered on the screen
 */
export abstract class DisplayObject {
  /**
   * The display object that contains this display object
   */
  public parent: DisplayObject | null = null;

  public transform: Transform = new Transform();

  abstract removeChild(child: DisplayObject): void;

  /**
   * Renders the object using the Canvas renderer
   *
   * @param renderer - The renderer
   */
  abstract render(renderer: CanvasRenderer): void;

  /**
   * The coordinate of the object relative to the local coordinates of the parent.
   */
  get position(): Point {
    return this.transform.position;
  }

  set position(value: Point) {
    this.transform.position.copyFrom(value);
  }

  /**
   * The scale factors of this object along the local coordinate axes.
   *
   * The default scale is (1, 1).
   */
  get scale(): Point {
    return this.transform.scale;
  }

  set scale(value: Point) {
    this.transform.scale.copyFrom(value);
  }
}
