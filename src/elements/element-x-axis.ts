import { RenderableElement, ScaleLinear, ScaleTime } from "../types";
import { TICK_LABEL_FONT, TICK_LABEL_FONT_SIZE } from "../constants";
import {
  timeDay,
  timeHour,
  timeMinute,
  timeMonth,
  timeSecond,
  timeWeek,
  timeYear,
} from "d3-time";

import { Colors } from "../helpers";
import { getNumXTicks } from "../helpers/helpers-axis";
import { timeFormat } from "d3-time-format";

const formatMillisecond = timeFormat(".%L");
const formatSecond = timeFormat(":%S");
const formatMinute = timeFormat("%H:%M");
const formatHour = timeFormat("%H:%M");
const formatDay = timeFormat("%a %d");
const formatWeek = timeFormat("%b %d");
const formatMonth = timeFormat("%B");
const formatYear = timeFormat("%Y");

function multiFormat(date: Date) {
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

function addXAxisPath(
  ctx: CanvasRenderingContext2D,
  xScale: ScaleTime,
  pixelRatio: number
) {
  ctx.strokeStyle = "#fff";

  const tickFormat = multiFormat;

  const xRange = xScale.range();
  const numXTicks = getNumXTicks(xRange[1] - xRange[0]);
  const xTicks = xScale.ticks(numXTicks);

  xTicks.forEach(function drawTick(tick) {
    ctx.beginPath();
    ctx.fillStyle = Colors.GRAY_LIGHT;
    ctx.textBaseline = "top";
    ctx.textAlign = "center";
    ctx.font = `${TICK_LABEL_FONT_SIZE}px ${TICK_LABEL_FONT}`;
    ctx.fillText(tickFormat(tick), xScale(tick), 9);
    ctx.closePath();
  });
}

export class XAxisElement implements RenderableElement {
  draw(
    ctx: CanvasRenderingContext2D,
    xScale: ScaleTime,
    _yScale: ScaleLinear,
    pixelRatio = 1
  ) {
    addXAxisPath(ctx, xScale, pixelRatio);
  }
}
