import { Point } from "./point";

export class Transform {
  public position: Point;
  public scale: Point;

  constructor() {
    this.position = new Point(0, 0);
    this.scale = new Point(1, 1);
  }
}
