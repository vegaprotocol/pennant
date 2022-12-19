import {
  timeDay,
  timeMonth,
  utcDay,
  utcHour,
  utcMinute,
  utcMonth,
  utcSecond,
  utcWeek,
  utcYear,
} from "d3-time";
import { timeFormat } from "d3-time-format";
import { format } from "date-fns";

import { Interval } from "../types";

const formatMillisecond = timeFormat(".%L");
const formatSecond = timeFormat(":%S");
const formatMinute = timeFormat("%H:%M");
const formatHour = timeFormat("%H:%M");
const formatDay = timeFormat("%b %d");
const formatWeek = timeFormat("%b %d");
const formatMonth = timeFormat("%B");
const formatYear = timeFormat("%Y");

export function dateFormat(date: Date, interval: Interval) {
  switch (interval) {
    case Interval.I1M:
      return formatMinute(date);
    case Interval.I5M:
      return formatMinute(date);
    case Interval.I15M:
      return formatMinute(date);
    case Interval.I1H:
      return formatHour(date);
    case Interval.I6H:
      return formatHour(date);
    case Interval.I1D:
      return formatDay(date);
  }
}

// TODO: Don't create a new Intl.NumberFormat instance on every invocation
export const formatter = (value: number, fractionDigits: number = 5) => {
  if (isNaN(value)) {
    return "-";
  }

  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(value);
};

export function tickFormat(ticks: Date[], interval: Interval) {
  switch (interval) {
    case Interval.I1M:
    case Interval.I5M:
    case Interval.I15M: {
      const arr = [];

      for (let i = 0; i < ticks.length; i++) {
        if (
          (i === 0 && timeDay(ticks[i]) < ticks[i]) ||
          (i > 0 && ticks[i - 1].getDay() === ticks[i].getDay())
        ) {
          arr.push(format(ticks[i], "HH:mm"));
        } else {
          arr.push(format(ticks[i], "d"));
        }
      }

      return arr;
    }
    case Interval.I1H:
    case Interval.I6H: {
      const arr = [];

      for (let i = 0; i < ticks.length; i++) {
        if (
          (i === 0 && timeDay(ticks[i]) < ticks[i]) ||
          (i > 0 && ticks[i - 1].getDay() === ticks[i].getDay())
        ) {
          arr.push(format(ticks[i], "HH:mm"));
        } else {
          arr.push(format(ticks[i], "d"));
        }
      }

      return arr;
    }
    case Interval.I1D: {
      const arr = [];

      for (let i = 0; i < ticks.length; i++) {
        if (
          (i === 0 && timeMonth(ticks[i]) < ticks[i]) ||
          (i > 0 && ticks[i - 1].getMonth() === ticks[i].getMonth())
        ) {
          arr.push(format(ticks[i], "d"));
        } else {
          arr.push(format(ticks[i], "d LLL"));
        }
      }

      return arr;
    }
  }
}

/**
 * Creates a number formatter
 * @param decimalPlaces Number of decimal places to display
 */
export const numberFormatter = (decimalPlaces: number): Intl.NumberFormat =>
  new Intl.NumberFormat("en-gb", {
    maximumFractionDigits: decimalPlaces,
    minimumFractionDigits: decimalPlaces,
  });

export function defaultPriceFormat(price: number) {
  return numberFormatter(2).format(price);
}
