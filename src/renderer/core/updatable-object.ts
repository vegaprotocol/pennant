import { ScaleLinear, ScaleTime } from "d3-scale";

export interface UpdatableObject {
  update(
    timeScale: ScaleTime<number, number>,
    priceScale: ScaleLinear<number, number>,
    width: number,
    height: number,
    resolution?: number
  ): void;
}
