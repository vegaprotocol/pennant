import { CurveFactory, curveStepBefore } from "d3-shape";

import { Container } from "../../../renderer/display";
import { Graphics } from "../../../renderer/graphics";
import { AXIS_HEIGHT } from "../depth-chart";

export class DepthCurve extends Container {
  public area: Graphics = new Graphics();
  public line: Graphics = new Graphics();

  public stroke: number;
  public fill: number;
  public curve: CurveFactory;

  constructor(
    stroke: number = 0,
    fill: number = 0xffffff,
    curve: CurveFactory = curveStepBefore
  ) {
    super();

    this.stroke = stroke;
    this.fill = fill;
    this.curve = curve;

    this.area.lineStyle({ width: 0 });
    this.line.lineStyle({ width: 1, color: stroke, alpha: 0.5 });

    this.addChild(this.area);
    this.addChild(this.line);
  }

  public update(
    points: [number, number][],
    height: number,
    resolution: number = 1
  ): void {
    this.area.clear();
    this.area.beginFill(this.fill, 0.5);
    this.area.drawArea(points, this.curve, height - resolution * AXIS_HEIGHT);
    this.area.endFill();

    this.line.clear();
    this.line.lineStyle({ width: 1, color: this.stroke });
    this.line.drawLine(points, this.curve);
  }
}
