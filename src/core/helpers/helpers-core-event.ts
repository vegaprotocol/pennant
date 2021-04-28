import { ScaleLinear, ScaleTime } from "../../types";
import { Selection, select } from "d3-selection";
import { ZoomBehavior, ZoomTransform } from "d3-zoom";

import { PlotArea } from "../plot-area";
import { WIDTH } from "../../constants";
import { XAxis } from "../x-axis";
import { YAxis } from "../y-axis";
import { Core, Panes } from "../core";
import { PlotAreaInteraction } from "../plot-area-interaction";
import { Dispatch } from "d3-dispatch";

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
  plotAreaElements: Panes<Selection<Element, any, null, undefined>>,
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
  plotAreaElements[id].call(
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
  event: any,
  xScale: ScaleTime,
  xTransform: () => ZoomTransform,
  xAxis: XAxis,
  yAxes: Panes<YAxis>,
  plotAreas: Panes<PlotArea>
) {
  const { width, pixelRatio } = event.detail;
  xScale.range([0, width / pixelRatio]);

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
  xAxis: XAxis,
  yAxes: Panes<YAxis>,
  id: string,
  onRedraw: () => void
) {
  const [_index, x] = plotAreas[id].getIndex(offset[0]);

  Object.values(plotAreas).forEach((plotArea) => {
    plotArea.crosshair([x, offset[1]]);
  });

  xAxis.crosshair(x);
  yAxes[id].crosshair(offset[1]);

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
  yAxis: YAxis
) {
  const { height, pixelRatio } = event.detail;

  const yr = yTransform().rescaleY(scale.range([height / pixelRatio, 0]));

  plotArea.yScale(yr);
  yAxis.yScale(yr);
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

  plotAreas[id].crosshair([x, offset[1]]);
  yAxes[id].crosshair(offset[1]);

  onMousemove(index, id);
  onRedraw();
}
