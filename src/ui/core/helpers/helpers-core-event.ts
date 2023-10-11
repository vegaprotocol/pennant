import { DEFAULT_INTERVAL_WIDTH, Y_AXIS_WIDTH } from "@util/constants";
import { ScaleLinear, ScaleTime } from "@util/types";
import { select, Selection } from "d3-selection";
import { ZoomBehavior, ZoomTransform } from "d3-zoom";

import { Panes } from "../core";
import { PlotArea } from "../plot-area";
import { PlotAreaAnnotations } from "../plot-area-annotations";
import { PlotAreaInteraction } from "../plot-area-interaction";
import { XAxis } from "../x-axis";
import { YAxis } from "../y-axis";
import { recalculateScale } from ".";

export function handleXAxisDrag(
  xElement: Selection<Element, unknown, null, undefined>,
  xZoom: ZoomBehavior<Element, unknown>,
  e: any,
  xScale: ScaleTime,
  isPinned: boolean,
  xTransform: () => ZoomTransform,
  xAxis: XAxis,
  plotAreas: Panes<PlotArea>,
  yAxes: Panes<YAxis>,
  onBoundsChanged: (bounds: [Date, Date]) => void,
  onRedraw: () => void,
) {
  xElement.call(
    xZoom.scaleBy,
    Math.pow(2, -e.dx / (xScale.range()[1] - xScale.range()[0])),
    [
      isPinned
        ? xScale.range()[1] - Y_AXIS_WIDTH
        : (xScale.range()[1] - xScale.range()[0]) / 2,
      0,
    ],
  );

  const xr = xTransform().rescaleX(xScale);
  xAxis.xScale(xr);

  for (const plotArea of Object.values(plotAreas)) {
    plotArea.xScale(xr);
  }

  for (const axis of Object.values(yAxes)) {
    axis.xScale(xr);
  }

  onBoundsChanged(xr.domain() as [Date, Date]);
  onRedraw();
}

export function handleYAxisDrag(
  yElement: Selection<Element, any, null, undefined>,
  yZoom: ZoomBehavior<Element, unknown>,
  e: any,
  yScale: ScaleLinear,
  yTransform: () => ZoomTransform,
  plotArea: PlotArea,
  yAxis: YAxis,
  onFreePanChanged: (isFreePan: boolean) => void,
  onRedraw: () => void,
): void {
  yElement.call(
    yZoom.scaleBy,
    Math.pow(2, -e.dy / (yScale.range()[0] - yScale.range()[1])),
    [0, (yScale.range()[0] - yScale.range()[1]) / 2],
  );

  const yr = yTransform().rescaleY(yScale);

  plotArea.yScale(yr);
  yAxis.yScale(yr);

  onFreePanChanged(true);
  onRedraw();
}

export function measureXAxis(
  event: { detail: { width: number; pixelRatio: number } },
  xScale: ScaleTime,
  xZoom: ZoomBehavior<Element, unknown>,
  xTransform: () => ZoomTransform,
  xAxis: XAxis,
  yAxes: Panes<YAxis>,
  plotAreas: Panes<PlotArea>,
  dates: Date[],
  onBoundsChanged: (bounds: [Date, Date]) => void,
) {
  const { width, pixelRatio } = event.detail;

  // Sometimes the reported width is zero. In this case there is no point performing any calculations
  if (width === 0) {
    return;
  }

  const ratio = width / pixelRatio / (xScale.range()[1] - xScale.range()[0]);

  if (ratio !== 1) {
    const domainWidth =
      xScale.domain()[1].getTime() - xScale.domain()[0].getTime();

    const domain0 = xScale.domain()[1].getTime() - ratio * domainWidth;
    const domain1 = xScale.domain()[1].getTime();

    xScale.domain([new Date(domain0), new Date(domain1)]);
    onBoundsChanged([new Date(domain0), new Date(domain1)]);
  }

  xScale.range([0, width / pixelRatio]);

  const k = xTransform().k;

  const offset =
    (width / pixelRatio - (Y_AXIS_WIDTH + DEFAULT_INTERVAL_WIDTH * 3)) / k;

  xZoom.translateExtent([
    [xScale(dates[0]) - offset, -Infinity],
    [xScale(dates[dates.length - 1]) + offset, Infinity],
  ]);

  const xr = xTransform().rescaleX(xScale);
  xAxis.xScale(xr);

  for (const axis of Object.values(yAxes)) {
    axis.xScale(xr);
  }

  for (const plotArea of Object.values(plotAreas)) {
    plotArea.xScale(xr);
  }
  onBoundsChanged(xr.domain() as [Date, Date]);
}

export function drawXAxis(event: any, xAxis: XAxis) {
  const ctx = select(event.currentTarget)
    .select<HTMLCanvasElement>("canvas")
    .node()
    ?.getContext("2d");

  if (ctx) {
    const pixelRatio = event.detail.pixelRatio;

    ctx?.scale(pixelRatio, pixelRatio);

    xAxis.context(ctx).pixelRatio(pixelRatio).draw();
  }
}

export function handleZoomend(
  plotAreas: Panes<PlotArea>,
  offset: [number, number],
  yScale: ScaleLinear,
  xAxis: XAxis,
  yAxis: YAxis,
  id: string,
  onRedraw: () => void,
) {
  const index = plotAreas[id].getIndex(offset[0]);

  if (index === null) {
    return;
  }

  for (const plotArea of Object.values(plotAreas)) {
    plotArea.crosshair([index[1], yScale.invert(offset[1])]);
  }

  xAxis.crosshair(index[1]);
  yAxis.crosshair(yScale.invert(offset[1]));

  onRedraw();
}

export function handleZoomstart(
  plotAreas: Panes<PlotArea>,
  yAxes: Panes<YAxis>,
  xAxis: XAxis,
) {
  for (const plotArea of Object.values(plotAreas)) {
    plotArea.crosshair([null, null]);
  }

  for (const axis of Object.values(yAxes)) {
    axis.crosshair(null);
  }

  xAxis.crosshair(null);
}

export function measureYAxis(
  event: any,
  scale: ScaleLinear,
  yTransform: () => ZoomTransform,
  plotArea: PlotArea,
  plotAreaInteraction: PlotAreaInteraction,
  plotAreaAnnotations: PlotAreaAnnotations,
  yAxis: YAxis,
  isFreePan: boolean,
  id: string,
  resetYAxis: (id: string) => void,
) {
  const { height, pixelRatio } = event.detail;

  scale.range([height / pixelRatio, 0]);
  const yr = yTransform().rescaleY(scale);

  plotArea.yScale(yr);
  plotAreaInteraction.yScale(yr);
  plotAreaAnnotations.yScale(yr);
  yAxis.yScale(yr);

  if (!isFreePan) {
    resetYAxis(id);
  }
}

export function drawPlotAreaInteraction(
  event: any,
  plotAreaInteraction: PlotAreaInteraction,
) {
  plotAreaInteraction.draw(select(event.currentTarget).select("svg"));
}

export function drawPlotArea(event: any, plotArea: PlotArea) {
  const ctx = select(event.currentTarget)
    .select<HTMLCanvasElement>("canvas")
    .node()
    ?.getContext("2d");

  if (ctx) {
    const pixelRatio = event.detail.pixelRatio;
    ctx.scale(pixelRatio, pixelRatio);
    plotArea.context(ctx).pixelRatio(pixelRatio).draw();
  }
}

export function drawYAxis(event: any, yAxis: YAxis) {
  const ctx = select(event.currentTarget)
    .select<HTMLCanvasElement>("canvas")
    .node()
    ?.getContext("2d");

  if (ctx) {
    const pixelRatio = event.detail.pixelRatio;
    ctx.scale(pixelRatio, pixelRatio);
    yAxis.context(ctx).pixelRatio(pixelRatio).draw();
  }
}

export function handleMouseout(
  plotAreas: Panes<PlotArea>,
  xAxis: XAxis,
  yAxes: Panes<YAxis>,
  onMouseout: () => void,
  onRedraw: () => void,
) {
  for (const plotArea of Object.values(plotAreas)) {
    plotArea.crosshair([null, null]);
  }

  xAxis.crosshair(null);

  for (const axis of Object.values(yAxes)) {
    axis.crosshair(null);
  }

  onMouseout();
  onRedraw();
}

export function handleMousemove(
  plotAreas: Panes<PlotArea>,
  offset: [number, number],
  yScale: ScaleLinear,
  yAxes: Panes<YAxis>,
  xAxis: XAxis,
  id: string,
  onMousemove: (index: number, id: string) => void,
  onRedraw: () => void,
) {
  // Calculate index of data item
  const index = plotAreas[id].getIndex(offset[0]);

  if (index === null) {
    return;
  }

  for (const plotArea of Object.values(plotAreas)) {
    plotArea.crosshair([index[1], null]);
  }

  for (const axis of Object.values(yAxes)) {
    axis.crosshair(null);
  }

  xAxis.crosshair(index[1]);

  plotAreas[id].crosshair([index[1], yScale.invert(offset[1])]);
  yAxes[id].crosshair(yScale.invert(offset[1]));

  onMousemove(index[0], id);
  onRedraw();
}

export function handleZoom(
  xScale: ScaleTime,
  yScales: Panes<ScaleLinear>,
  xAxis: XAxis,
  yAxes: Panes<YAxis>,
  xElement: Selection<Element, unknown, null, undefined>,
  xZoom: ZoomBehavior<Element, unknown>,
  xTransform: () => ZoomTransform,
  yElements: Panes<Selection<Element, unknown, null, undefined>>,
  yTransforms: Panes<() => ZoomTransform>,
  yZooms: Panes<ZoomBehavior<Element, unknown>>,
  plotAreas: Panes<PlotArea>,
  isPinned: boolean,
  isFreePan: boolean,
  isSimple: boolean,
  dates: Date[],
  t: ZoomTransform,
  point: [number, number],
  id: string,
  onBoundsChanged: (bounds: [Date, Date]) => void,
  onRedraw: () => void,
  onFetchData: (from: Date, to: Date) => void,
  onIsPinnedChanged: (isPinned: boolean) => void,
) {
  if (t.k === 1) {
    xElement.call(xZoom.translateBy, t.x / xTransform().k, 0);

    if (isFreePan) {
      yElements[id].call(yZooms[id].translateBy, 0, t.y / yTransforms[id]().k);
    } else {
      Object.keys(plotAreas).forEach((id) => {
        recalculateScale(
          xTransform,
          xScale,
          yScales,
          id,
          plotAreas,
          yElements,
          yZooms,
        );
      });
    }

    onIsPinnedChanged(false);
  } else {
    const k = xTransform().k * t.k;

    const offset =
      (xScale.range()[1] - (Y_AXIS_WIDTH + DEFAULT_INTERVAL_WIDTH * 3)) / k;

    xZoom.translateExtent([
      [xScale(dates[0]) - offset, -Infinity],
      [xScale(dates[dates.length - 1]) + offset, Infinity],
    ]);

    const xr = xTransform().rescaleX(xScale);

    const referencePoint = xr(dates[dates.length - 1]);

    xElement.call(xZoom.scaleBy, t.k, isPinned ? [referencePoint, 0] : point);

    if (!isFreePan) {
      Object.keys(plotAreas).forEach((id) => {
        recalculateScale(
          xTransform,
          xScale,
          yScales,
          id,
          plotAreas,
          yElements,
          yZooms,
        );
      });
    }
  }

  const xr = xTransform().rescaleX(xScale);
  const yr = yTransforms[id]().rescaleY(yScales[id]);

  xAxis.xScale(xr);

  for (const plotArea of Object.values(plotAreas)) {
    plotArea.xScale(xr);
  }

  plotAreas[id].yScale(yr);
  yAxes[id].yScale(yr);

  const domain = xr.domain();
  const domainWidth = domain[1].getTime() - domain[0].getTime();

  if (dates[0].getTime() + domainWidth > domain[0].getTime()) {
    const to = dates[0];
    const from = new Date(dates[0].getTime() - domainWidth);

    onFetchData(from, to);
  }

  onRedraw();
  onBoundsChanged(xr.domain() as [Date, Date]);
}
