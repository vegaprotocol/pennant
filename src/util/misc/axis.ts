import { MIN_NUM_TICKS } from "../constants";

export function getNumXTicks(size: number): number {
  return Math.max(MIN_NUM_TICKS, Math.abs(size) / 100);
}

export function getNumYTicks(size: number): number {
  return Math.max(MIN_NUM_TICKS, Math.abs(size) / 50);
}
