import { Interval } from "@util/types";
import { differenceInMinutes, format } from "date-fns";

export type GQLInterval = keyof typeof Interval;

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
