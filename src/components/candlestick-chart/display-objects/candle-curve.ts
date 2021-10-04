import { CurveFactory, curveStepBefore } from "d3-shape";

import { Container } from "../../../renderer/display";
import { Graphics } from "../../../renderer/graphics";
import { Rectangle } from "../../../renderer/math";

/**
 * Draws candles
 */
export class CandleCurve extends Container {
  private area: Graphics = new Graphics();
  private line: Graphics = new Graphics();

  private stroke: number;
  private fill: number;
  private curve: CurveFactory;

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
    this.area.beginFill(this.fill);
    this.area.drawArea(points, this.curve, height);
    this.area.endFill();

    this.line.clear();
    this.line.lineStyle({ width: 1, color: 0x009cff });
    this.line.drawLine(points, this.curve);
  }
}
