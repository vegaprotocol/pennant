import {
  utcDay,
  utcHour,
  utcMinute,
  utcMonth,
  utcSecond,
  utcWeek,
  utcYear,
} from "d3-time";
import { timeFormat } from "d3-time-format";
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

// FIXME: UTC is not correct
export function multiFormat(date: Date) {
  return (utcSecond(date) < date
    ? formatMillisecond
    : utcMinute(date) < date
    ? formatSecond
    : utcHour(date) < date
    ? formatMinute
    : utcDay(date) < date
    ? formatHour
    : utcMonth(date) < date
    ? utcWeek(date) < date
      ? formatDay
      : formatWeek
    : utcYear(date) < date
    ? formatMonth
    : formatYear)(date);
}
export const formatter = (value: number, fractionDigits: number = 5) =>
  new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(value);
