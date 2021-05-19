import { select, Selection } from "d3-selection";
import { ZoomBehavior, ZoomTransform } from "d3-zoom";

import { DEFAULT_INTERVAL_WIDTH, WIDTH } from "../../constants";
import { ScaleLinear, ScaleTime } from "../../types";
import { Panes } from "../core";
import { PlotArea } from "../plot-area";
import { PlotAreaAnnotations } from "../plot-area-annotations";
import { PlotAreaInteraction } from "../plot-area-interaction";
import { XAxis } from "../x-axis";
import { YAxis } from "../y-axis";

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
  onRedraw: () => void
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

  onBoundsChanged(xr.domain() as [Date, Date]);
  onRedraw();
}

export function handleYAxisDrag(
  yElements: Panes<Selection<Element, any, null, undefined>>,
  yZooms: Panes<ZoomBehavior<Element, unknown>>,
  e: any,
  yScales: Panes<ScaleLinear>,
  yTransforms: Panes<() => ZoomTransform>,
  plotAreas: Panes<PlotArea>,
  yAxes: Panes<YAxis>,
  id: string,
  onFreePanChanged: (isFreePan: boolean) => void,
  onRedraw: () => void
): void {
  yElements[id].call(
    yZooms[id].scaleBy,
    1 - e.dy / (yScales[id].range()[0] - yScales[id].range()[1]),
    [0, (yScales[id].range()[0] - yScales[id].range()[1]) / 2]
  );

  const yr = yTransforms[id]().rescaleY(yScales[id]);

  plotAreas[id].yScale(yr);
  yAxes[id].yScale(yr);

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
  onBoundsChanged: (bounds: [Date, Date]) => void
) {
  const { width, pixelRatio } = event.detail;
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
    (width / pixelRatio - (WIDTH + DEFAULT_INTERVAL_WIDTH * 3)) / k;

  xZoom.translateExtent([
    [xScale(dates[0]) - offset, -Infinity],
    [xScale(dates[dates.length - 1]) + offset, Infinity],
  ]);

  const xr = xTransform().rescaleX(xScale);
  xAxis.xScale(xr);
  Object.values(yAxes).forEach((axis) => axis.xScale(xr));
  Object.values(plotAreas).forEach((plotArea) => plotArea.xScale(xr));
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
  yAxes: Panes<YAxis>,
  id: string,
  onRedraw: () => void
) {
  const [_index, x] = plotAreas[id].getIndex(offset[0]);

  Object.values(plotAreas).forEach((plotArea) => {
    plotArea.crosshair([x, yScale.invert(offset[1])]);
  });

  xAxis.crosshair(x);
  yAxes[id].crosshair(yScale.invert(offset[1]));

  onRedraw();
}

export function handleZoomstart(
  plotAreas: Panes<PlotArea>,
  yAxes: Panes<YAxis>,
  xAxis: XAxis
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
  plotArea: PlotArea,
  plotAreaAnnotations: PlotAreaAnnotations,
  yAxis: YAxis,
  isFreePan: boolean,
  id: string,
  resetYAxis: (id: string) => void
) {
  const { height, pixelRatio } = event.detail;

  scale.range([height / pixelRatio, 0]);
  const yr = yTransform().rescaleY(scale);

  plotArea.yScale(yr);
  plotAreaAnnotations.yScale(yr);
  yAxis.yScale(yr);

  if (!isFreePan) {
    resetYAxis(id);
  }
}

export function drawPlotAreaInteraction(
  event: any,
  plotAreaInteractions: Panes<PlotAreaInteraction>,
  id: string
) {
  plotAreaInteractions[id].draw(select(event.currentTarget).select("svg"));
}

export function drawPlotArea(
  event: any,
  plotAreas: Panes<PlotArea>,
  id: string
) {
  const ctx = select(event.currentTarget)
    .select<HTMLCanvasElement>("canvas")
    .node()
    ?.getContext("2d");

  if (ctx) {
    const pixelRatio = event.detail.pixelRatio;
    ctx.scale(pixelRatio, pixelRatio);
    plotAreas[id].context(ctx).pixelRatio(pixelRatio).draw();
  }
}

export function drawYAxis(event: any, yAxes: Panes<YAxis>, id: string) {
  const ctx = select(event.currentTarget)
    .select<HTMLCanvasElement>("canvas")
    .node()
    ?.getContext("2d");

  if (ctx) {
    const pixelRatio = event.detail.pixelRatio;
    ctx.scale(pixelRatio, pixelRatio);
    yAxes[id].context(ctx).pixelRatio(pixelRatio).draw();
  }
}

export function handleMouseout(
  plotAreas: Panes<PlotArea>,
  xAxis: XAxis,
  yAxes: Panes<YAxis>,
  onMouseout: () => void,
  onRedraw: () => void
) {
  Object.values(plotAreas).forEach((plotArea) =>
    plotArea.crosshair([null, null])
  );

  xAxis.crosshair(null);
  Object.values(yAxes).forEach((axis) => {
    axis.crosshair(null);
  });

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
  onRedraw: () => void
) {
  // Calculate index of data item
  const [index, x] = plotAreas[id].getIndex(offset[0]);

  Object.values(plotAreas).forEach((plotArea) => plotArea.crosshair([x, null]));

  Object.values(yAxes).forEach((axis) => {
    axis.crosshair(null);
  });

  xAxis.crosshair(x);

  plotAreas[id].crosshair([x, yScale.invert(offset[1])]);
  yAxes[id].crosshair(yScale.invert(offset[1]));

  onMousemove(index, id);
  onRedraw();
}
