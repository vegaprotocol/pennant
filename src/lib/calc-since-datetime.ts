import { Interval } from "../data/globalTypes";
import { format } from "date-fns";
import { parseInterval } from "./interval";

const CANDLES_COUNT: number = 1;
const CANDLE_LOAD_LIMIT: number = 20;

const minutesToMS = (mins: number): number => mins * 60 * 1000;
const hoursToMS = (hours: number): number => hours * 60 * 60 * 1000;
const daysToMS = (days: number): number => days * 24 * 60 * 60 * 1000;
export const RFC3339WITHOUTNANO = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'";

/**
 * Calculates the timestamp required to generate 300 candles
 * TODO: Tests for this func
 */
export function calcSinceDatetime(
  interval: Interval,
  width?: number,
  startTimestamp = Date.now()
): string {
  // Get raw values from interval enum
  const [intervalValue, intervalUnit] = parseInterval(interval);

  // Creates a map of intervals to their duration in ms. EG: { 'I1M': 60,000ms }
  const intervalMSMap: { [interval: string]: number } = Object.keys(
    Interval
  ).reduce((obj, intervalStr) => {
    let ms: number;

    switch (intervalUnit) {
      case "M":
        ms = minutesToMS(intervalValue);
        break;
      case "H":
        ms = hoursToMS(intervalValue);
        break;
      case "D":
        ms = daysToMS(intervalValue);
        break;
      default:
        throw new Error("Invalid interval unit");
    }

    // @ts-ignore
    obj[intervalStr] = ms;
    return obj;
  }, {});

  // Load in 3 window widths worth of candles
  const count = width ? Math.floor(width / CANDLE_LOAD_LIMIT) : CANDLES_COUNT;
  const milliseconds = startTimestamp - count * intervalMSMap[interval];

  // trading-core uses RFC3339NANO, but as we can't handle nanoseconds this is fine
  return format(milliseconds, RFC3339WITHOUTNANO);
}
