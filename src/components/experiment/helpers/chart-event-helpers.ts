import { ScaleLinear, ScaleTime } from "../../../types";
import { Selection, select } from "d3-selection";
import { ZoomBehavior, ZoomTransform } from "d3-zoom";

import { WIDTH } from "../../../constants";
import { xAxisInterface } from "../x-axis";

export function handleXAxisDrag(
  xElement: Selection<Element, unknown, null, undefined>,
  xZoom: ZoomBehavior<Element, unknown>,
  e: any,
  xScale: ScaleTime,
  isPinned: boolean,
  xTransform: () => ZoomTransform,
  xAxis: xAxisInterface,
  plotAreas: Record<string, any>,
  yAxes: Record<string, any>,
  listeners: any,
  chart: any
) {
  xElement.call(
    xZoom.scaleBy,
    1 - e.dx / (xScale.range()[1] - xScale.range()[0]),
    [
      isPinned
        ? xScale.range()[1] - WIDTH
        : (xScale.range()[1] - xScale.range()[0]) / 2,
      0,
    ]
  );

  const xr = xTransform().rescaleX(xScale);
  xAxis.xScale(xr);
  Object.values(plotAreas).forEach((plotArea) => plotArea.xScale(xr));
  Object.values(yAxes).forEach((axis) => axis.xScale(xr));

  listeners.call("redraw", chart);
  listeners.call("bounds_changed", chart, xr.domain());
}

export function measureXAxis(
  event: any,
  xScale: ScaleTime,
  xTransform: () => ZoomTransform,
  xAxis: xAxisInterface,
  yAxes: Record<string, any>,
  plotAreas: Record<string, any>
) {
  const { width, pixelRatio } = event.detail;
  xScale.range([0, width / pixelRatio]);

  const xr = xTransform().rescaleX(xScale);
  xAxis.xScale(xr);
  Object.values(yAxes).forEach((axis) => axis.xScale(xr));
  Object.values(plotAreas).forEach((plotArea) => plotArea.xScale(xr));
}

export function drawXAxis(event: any, xAxis: xAxisInterface) {
  const ctx = select(event.currentTarget)
    .select<HTMLCanvasElement>("canvas")
    .node()
    ?.getContext("2d");

  if (ctx) {
    const pixelRatio = event.detail.pixelRatio;

    ctx?.scale(pixelRatio, pixelRatio);

    xAxis.context(ctx).pixelRatio(pixelRatio)();
  }
}

export function handleZoomend(
  plotAreas: Record<string, any>,
  offset: [number, number],
  xAxis: xAxisInterface,
  yAxes: Record<string, any>,
  id: string,
  listeners: any,
  chart: any
) {
  Object.values(plotAreas).forEach((plotArea) => {
    plotArea.crosshair(offset);
  });

  xAxis.crosshair(offset[0]);
  yAxes[id].crosshair(offset[1]);

  listeners.call("redraw", chart);
}

export function handleZoomstart(
  plotAreas: Record<string, any>,
  yAxes: Record<string, any>,
  xAxis: xAxisInterface
) {
  Object.values(plotAreas).forEach((plotArea) => {
    plotArea.crosshair([null, null]);
  });

  Object.values(yAxes).forEach((axis) => {
    axis.crosshair(null);
  });

  xAxis.crosshair(null);
}

export function measureYAxis(
  event: any,
  scale: ScaleLinear,
  yTransform: () => ZoomTransform,
  plotArea: Record<string, any>,
  yAxis: Record<string, any>
) {
  const { height, pixelRatio } = event.detail;
  scale.range([height / pixelRatio, 0]);

  const yr = yTransform().rescaleY(scale);

  plotArea.yScale(yr);
  yAxis.yScale(yr);
}

export function drawPlotAreaInteraction(
  event: any,
  plotAreaInteractions: Record<string, any>,
  id: string
) {
  select(event.currentTarget)
    .select<SVGSVGElement>("svg")
    .call(plotAreaInteractions[id]);
}

export function drawPlotArea(
  event: any,
  plotAreas: Record<string, any>,
  id: string
) {
  const ctx = select(event.currentTarget)
    .select<HTMLCanvasElement>("canvas")
    .node()
    ?.getContext("2d");

  const pixelRatio = event.detail.pixelRatio;

  ctx?.scale(pixelRatio, pixelRatio);

  plotAreas[id].context(ctx).pixelRatio(pixelRatio)();
}

export function drawYAxis(event: any, yAxes: Record<string, any>, id: string) {
  const ctx = select(event.currentTarget)
    .select<HTMLCanvasElement>("canvas")
    .node()
    ?.getContext("2d");

  const pixelRatio = event.detail.pixelRatio;

  ctx?.scale(pixelRatio, pixelRatio);

  yAxes[id].context(ctx).pixelRatio(pixelRatio)();
}

export function handleMouseout(
  plotAreas: Record<string, any>,
  xAxis: xAxisInterface,
  yAxes: Record<string, any>,
  listeners: any,
  chart: any
) {
  Object.values(plotAreas).forEach((plotArea) =>
    plotArea.crosshair([null, null])
  );

  xAxis.crosshair(null);
  Object.values(yAxes).forEach((axis) => {
    axis.crosshair(null);
  });

  listeners.call("redraw", chart);
}

export function handleMousemove(
  plotAreas: Record<string, any>,
  offset: [number, number],
  yAxes: Record<string, any>,
  xAxis: xAxisInterface,
  id: string,
  listeners: any,
  chart: any
) {
  Object.values(plotAreas).forEach((plotArea) =>
    plotArea.crosshair([offset[0], null])
  );

  Object.values(yAxes).forEach((axis) => {
    axis.crosshair(null);
  });

  xAxis.crosshair(offset[0]);

  plotAreas[id].crosshair(offset);
  yAxes[id].crosshair(offset[1]);

  listeners.call("redraw", chart);
}