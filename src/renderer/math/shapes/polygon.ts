import { SHAPES } from "../const";
import { PointData } from "../point";

export class Polygon {
  public points: number[];
  public closeStroke: boolean;
  public readonly type: SHAPES.POLY;

  constructor(points: PointData[] | number[]);
  constructor(...points: PointData[] | number[]);

  constructor(...points: any[]) {
    let flat: PointData[] | number[] = Array.isArray(points[0])
      ? points[0]
      : points;

    // if this is an array of points, convert it to a flat array of numbers
    if (typeof flat[0] !== "number") {
      const p: number[] = [];

      for (let i = 0, il = flat.length; i < il; i++) {
        p.push((flat[i] as PointData).x, (flat[i] as PointData).y);
      }

      flat = p;
    }

    this.points = flat as number[];

    this.type = SHAPES.POLY;

    this.closeStroke = true;
  }

  clone(): Polygon {
    const points = this.points.slice();
    const polygon = new Polygon(points);

    polygon.closeStroke = this.closeStroke;

    return polygon;
  }

  contains(x: number, y: number): boolean {
    let inside = false;

    const length = this.points.length / 2;

    for (let i = 0, j = length - 1; i < length; j = i++) {
      const xi = this.points[i * 2];
      const yi = this.points[i * 2 + 1];
      const xj = this.points[j * 2];
      const yj = this.points[j * 2 + 1];
      const intersect =
        yi > y !== yj > y && x < (xj - xi) * ((y - yi) / (yj - yi)) + xi;

      if (intersect) {
        inside = !inside;
      }
    }

    return inside;
  }
}
