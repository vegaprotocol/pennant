import { Interval } from "@util/types";

export enum VegaInterval {
  /** 1 day interval */
  INTERVAL_I1D = "INTERVAL_I1D",
  /** 1 hour interval */
  INTERVAL_I1H = "INTERVAL_I1H",
  /** 1 minute interval */
  INTERVAL_I1M = "INTERVAL_I1M",
  /** 5 minute interval */
  INTERVAL_I5M = "INTERVAL_I5M",
  /** 6 hour interval */
  INTERVAL_I6H = "INTERVAL_I6H",
  /** 15 minute interval (default) */
  INTERVAL_I15M = "INTERVAL_I15M",
}

export const intervalMap: {
  [Property in keyof typeof Interval]: VegaInterval;
} = {
  [Interval.I1M]: VegaInterval.INTERVAL_I1M,
  [Interval.I5M]: VegaInterval.INTERVAL_I5M,
  [Interval.I15M]: VegaInterval.INTERVAL_I15M,
  [Interval.I1H]: VegaInterval.INTERVAL_I1H,
  [Interval.I6H]: VegaInterval.INTERVAL_I6H,
  [Interval.I1D]: VegaInterval.INTERVAL_I1D,
};
