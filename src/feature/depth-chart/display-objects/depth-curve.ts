import { Container, Graphics } from "@ui/renderer";
import { CurveFactory, curveStepBefore } from "d3-shape";

import { AXIS_HEIGHT } from "../depth-chart";

/**
 * Draws two area curves
 */
export class DepthCurve extends Container {
  private area: Graphics = new Graphics();
  private line: Graphics = new Graphics();

  private fill: number;
  private stroke: number;
  private width: number;
  private curve: CurveFactory;

  constructor(
    fill: number = 0xffffff,
    stroke: number = 0,
    width: number = 1,
    curve: CurveFactory = curveStepBefore,
  ) {
    super();

    this.fill = fill;
    this.stroke = stroke;
    this.width = width;
    this.curve = curve;

    this.area.lineStyle({ width: 0 });
    this.line.lineStyle({ width: width, color: stroke, alpha: 0.5 });

    this.addChild(this.area);
    this.addChild(this.line);
  }

  public update(
    points: [number, number][],
    height: number,
    resolution: number = 1,
    fill: number = 0xffffff,
    stroke: number = 0,
    width: number = 1,
  ): void {
    this.fill = fill;
    this.stroke = stroke;
    this.width = width;

    this.area.clear();
    this.area.beginFill(this.fill, 1);
    this.area.drawArea(
      points.map((point) => [
        point[0],
        height - resolution * AXIS_HEIGHT,
        point[1],
      ]),
      this.curve,
    );
    this.area.endFill();

    this.line.clear();
    this.line.lineStyle({ width: this.width, color: this.stroke });
    this.line.drawLine(points, this.curve);
  }
}
