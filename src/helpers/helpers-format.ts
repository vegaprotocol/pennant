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

const formatMillisecond = timeFormat(".%L");
const formatSecond = timeFormat(":%S");
const formatMinute = timeFormat("%H:%M");
const formatHour = timeFormat("%H:%M");
const formatDay = timeFormat("%a %d");
const formatWeek = timeFormat("%b %d");
const formatMonth = timeFormat("%B");
const formatYear = timeFormat("%Y");

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
export const formatter = (value: number, significantFigures: number = 5) =>
  new Intl.NumberFormat("en-GB", {
    maximumSignificantDigits: significantFigures,
    minimumSignificantDigits: significantFigures,
  }).format(value);
