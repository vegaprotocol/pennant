import { ScaleLinear, ScaleTime } from "d3-scale";

import { UpdatableObject } from "../../../renderer/core/updatable-object";
import { Graphics } from "../../../renderer/graphics";

/**
 * Draw a rule
 */
export class Rule extends Graphics implements UpdatableObject {
  public x1: Date = new Date(0);
  public y1: number = 0;
  public x2: Date = new Date(0);
  public y2: number = 0;

  private color: number;
  private lineDash: number[];

  constructor(color = 0xffffff, lineDash: number[] = []) {
    super();

    this.color = color;
    this.lineDash = lineDash;
  }

  public update(
    timeScale: ScaleTime<number, number>,
    priceScale: ScaleLinear<number, number>,
    _width: number,
    _height: number,
    resolution: number = 1
  ): void {
    const x = timeScale(this.x1);
    const x2 = timeScale(this.x2);
    const y = priceScale(this.y1);
    const y2 = priceScale(this.y2);

    this.clear();

    this.lineStyle({
      width: 1,
      color: this.color,
      lineDash: this.lineDash.map((value) => value * resolution),
    });

    this.moveTo(x, y);
    this.lineTo(x2, y2);
    this.endFill();
  }
}
