import {
  differenceInMinutes,
  format,
  subDays,
  subHours,
  subMinutes,
} from "date-fns";

import { Interval } from "../api/vega-graphql";

export type GQLInterval = keyof typeof Interval;

export interface IntervalOption {
  label: string;
  interval: Interval;
}

const unitMap = {
  M: 0,
  H: 1,
  D: 2,
};

/**
 * Creates an array of {interval,label} objects sorted by interval length
 * with translations from i18n/index.ts
 */
export function createIntervalOptions(
  intervals: GQLInterval[]
): IntervalOption[] {
  return (
    intervals
      .map((interval: GQLInterval) => ({
        interval: interval as Interval,
        label: INTERVALS[interval],
      }))

      // Remove any intervals which dont have a translation string
      .filter((interval) => !!interval.label)

      // Sort by interval length
      .sort((a, b) => {
        const [aValue, aUnit] = parseInterval(a.interval);
        const [bValue, bUnit] = parseInterval(b.interval);

        // Sort by unit first
        if (unitMap[aUnit] < unitMap[bUnit]) {
          return -1;
        }

        if (unitMap[aUnit] > unitMap[bUnit]) {
          return 1;
        }

        // The unit is the same, sort by value
        if (aValue < bValue) {
          return -1;
        }

        if (aValue > bValue) {
          return 1;
        }

        return 0;
      })
  );
}

export const INTERVALS: { [I in Interval]: string } = {
  I1M: "1m",
  I5M: "5m",
  I15M: "15m",
  I1H: "1h",
  I6H: "6h",
  I1D: "1d",
};

type IntervalUnit = "M" | "H" | "D";
type ParsedInterval = [number, IntervalUnit];

/** Parses an interval enum into a value and unit of time */
export function parseInterval(interval: Interval): ParsedInterval {
  const match = interval.match(/I(\d+)([MHD])/);

  if (!match) {
    throw new Error("Invalid interval value");
  }

  // TODO: Figure out how to better use the interval unit type
  // so that match[2] doesnt have to be cast
  return [parseInt(match[1], 10), match[2] as IntervalUnit];
}

export const DEFAULT_CANDLES = 110;
export const CANDLE_BUFFER = 20;

export function getInitialExtents(
  interval: Interval,
  endDate = new Date(Date.now())
): [Date, Date] {
  let startDate: Date;

  switch (interval) {
    case Interval.I1M:
      startDate = subMinutes(endDate, DEFAULT_CANDLES);
      break;
    case Interval.I5M:
      startDate = subMinutes(endDate, DEFAULT_CANDLES * 5);
      break;
    case Interval.I15M:
      startDate = subMinutes(endDate, DEFAULT_CANDLES * 15);
      break;
    case Interval.I1H:
      startDate = subHours(endDate, DEFAULT_CANDLES);
      break;
    case Interval.I6H:
      startDate = subHours(endDate, DEFAULT_CANDLES * 6);
      break;
    case Interval.I1D:
      startDate = subDays(endDate, DEFAULT_CANDLES);
      break;
    default:
      throw new Error("Invalid interval");
  }

  return [startDate, endDate];
}

export function getTimeFormat(interval: Interval) {
  switch (interval) {
    case Interval.I1M:
    case Interval.I5M:
    case Interval.I15M:
      return () => "HH:mm";
    case Interval.I1H:
    case Interval.I6H:
      return (d: Date) => {
        const timeStr = format(d, "HH:mm");
        if (timeStr === "00:00") {
          return "MMM d";
        } else {
          return "HH:mm";
        }
      };
    case Interval.I1D:
      return () => "MMM d";
    default:
      throw new Error("Invalid interval");
  }
}

export function getCandlesCount(interval: Interval, extents: [Date, Date]) {
  const diff = differenceInMinutes(extents[1], extents[0]);
  switch (interval) {
    case Interval.I1M:
      return Math.floor(diff);
    case Interval.I5M:
      return Math.floor(diff / 5);
    case Interval.I15M:
      return Math.floor(diff / 15);
    case Interval.I1H:
      return Math.floor(diff / 60);
    case Interval.I6H:
      return Math.floor(diff / (60 * 6));
    case Interval.I1D:
      return Math.floor(diff / (60 * 24));
    default:
      throw new Error("Invalid interval");
  }
}

export function getSubMinutes(interval: Interval, visibleCandleCount: number) {
  switch (interval) {
    case Interval.I1M:
      return visibleCandleCount;
    case Interval.I5M:
      return visibleCandleCount * 5;
    case Interval.I15M:
      return visibleCandleCount * 15;
    case Interval.I1H:
      return visibleCandleCount * 60;
    case Interval.I6H:
      return visibleCandleCount * 60 * 6;
    case Interval.I1D:
      return visibleCandleCount * 60 * 24;
    default:
      throw new Error("Invalid interval");
  }
}
