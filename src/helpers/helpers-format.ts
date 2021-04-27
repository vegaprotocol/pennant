import {
  timeDay,
  timeHour,
  timeMinute,
  timeMonth,
  timeSecond,
  timeWeek,
  timeYear,
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

export function multiFormat(date: Date) {
  return (timeSecond(date) < date
    ? formatMillisecond
    : timeMinute(date) < date
    ? formatSecond
    : timeHour(date) < date
    ? formatMinute
    : timeDay(date) < date
    ? formatHour
    : timeMonth(date) < date
    ? timeWeek(date) < date
      ? formatDay
      : formatWeek
    : timeYear(date) < date
    ? formatMonth
    : formatYear)(date);
}
export const formatter = (value: number, significantFigures: number = 5) =>
  new Intl.NumberFormat("en-GB", {
    maximumSignificantDigits: significantFigures,
    minimumSignificantDigits: significantFigures,
  }).format(value);
