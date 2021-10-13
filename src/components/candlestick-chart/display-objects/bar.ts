import { ScaleLinear, ScaleTime } from "d3-scale";

import { UpdatableObject } from "../../../renderer/core/updatable-object";
import { Graphics } from "../../../renderer/graphics";
import { Point } from "../../../renderer/math";

/**
 * Draw a bar
 */
export class Bar extends Graphics implements UpdatableObject {
  public x1: Date = new Date();
  public y1: number = 0;
  public width: number = 0;
  public height: number = 0;

  private stroke: number;
  private fill: number;

  constructor(fill = 0xffffff, stroke = 0x000000) {
    super();

    this.fill = fill;
    this.stroke = stroke;
  }

  public update(
    timeScale: ScaleTime<number, number>,
    priceScale: ScaleLinear<number, number>,
    _width: number,
    _height: number,
    resolution: number = 1
  ): void {
    this.clear();
    this.beginFill(this.fill, 1);
    this.drawRect(
      timeScale(this.x1),
      priceScale(this.y1),
      Math.abs(timeScale(this.width) - timeScale(0)),
      Math.abs(priceScale(this.height) - priceScale(0))
    );
    this.endFill();
  }
}
