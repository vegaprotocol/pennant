import { Colors, clearCanvas } from "../helpers";
import { CrosshairElement, GridElement } from "../elements";
import { RenderableElement, ScaleLinear, ScaleTime } from "../types";
import { bisector, extent } from "d3-array";

import { clamp } from "lodash";
import { closestIndexTo } from "date-fns";

export interface PlotAreaInterface {
  (): void;
  context(context: CanvasRenderingContext2D): PlotAreaInterface;
  crosshair(pos: [number | null, number | null]): PlotAreaInterface;
  data(originalData: any[]): PlotAreaInterface;
  extent(bounds?: [Date, Date]): [number, number];
  getIndex(offset: number): [number, number];
  pixelRatio(ratio: number): PlotAreaInterface;
  renderableElements(elements: RenderableElement[]): PlotAreaInterface;
  xScale(scale: ScaleTime): PlotAreaInterface;
  yScale(scale: ScaleLinear): PlotAreaInterface;
  yEncodingFields(fields: string[]): PlotAreaInterface;
}

export const plotArea = (
  x: ScaleTime,
  y: ScaleLinear,
  elements: RenderableElement[],
  originalData: any[],
  fields?: string[]
) => {
  let crosshair = new CrosshairElement();
  let ctx: CanvasRenderingContext2D | null = null;
  let data: any[] = originalData;
  let gridline = new GridElement();
  let pixelRatio: number = 1;
  let position: [number | null, number | null] = [null, null];
  let renderableElements: RenderableElement[] = elements;
  let xScale = x.copy();
  let yEncodingFields = fields;
  let yScale = y.copy();

  const plotArea: PlotAreaInterface = () => {
    if (ctx) {
      clearCanvas(ctx.canvas, ctx, Colors.BACKGROUND);
      gridline.draw(ctx, xScale, yScale, pixelRatio);

      renderableElements.forEach((element) =>
        element.draw(ctx!, xScale, yScale, pixelRatio)
      );

      crosshair.draw(ctx, xScale, yScale, pixelRatio, position);
    }
  };

  plotArea.context = (context: CanvasRenderingContext2D): PlotAreaInterface => {
    ctx = context;
    return plotArea;
  };

  plotArea.crosshair = (
    pos: [number | null, number | null]
  ): PlotAreaInterface => {
    position = pos;
    return plotArea;
  };

  plotArea.data = (originalData: any[]): PlotAreaInterface => {
    data = originalData;
    return plotArea;
  };

  plotArea.extent = (bounds?: [Date, Date]) => {
    return bounds
      ? extent(
          data
            .filter((d) => d.date >= bounds[0] && d.date <= bounds[1])
            .flatMap((d) => yEncodingFields?.map((field) => d[field]))
        )
      : extent(data.flatMap((d) => yEncodingFields?.map((field) => d[field])));
  };

  plotArea.getIndex = (offset: number): [number, number] => {
    const timeAtMouseX = xScale.invert(offset);
    const index = bisector((d: any) => d.date).left(data, timeAtMouseX);
    const firstElement: Date = data[Math.max(0, index - 1)].date;
    const secondElement: Date = data[Math.min(data.length - 1, index)].date;

    let element: Date;
    let indexOffset = 0;

    if (firstElement && secondElement) {
      const nearestCandleDates = [firstElement, secondElement];
      indexOffset = closestIndexTo(timeAtMouseX, nearestCandleDates);
      element = [firstElement, secondElement][indexOffset];
    } else if (firstElement) {
      indexOffset = 0;
      element = firstElement;
    } else {
      indexOffset = 1;
      element = secondElement;
    }

    const dataIndex = clamp(index + indexOffset - 1, 0, data.length - 1);

    return [dataIndex, xScale(data[dataIndex].date)];
  };

  plotArea.pixelRatio = (ratio: number): PlotAreaInterface => {
    pixelRatio = ratio;
    return plotArea;
  };

  plotArea.renderableElements = (
    elements: RenderableElement[]
  ): PlotAreaInterface => {
    renderableElements = elements;
    return plotArea;
  };

  plotArea.xScale = (x: ScaleTime): PlotAreaInterface => {
    xScale = x.copy();
    return plotArea;
  };

  plotArea.yEncodingFields = (fields: string[]): PlotAreaInterface => {
    yEncodingFields = fields;
    return plotArea;
  };

  plotArea.yScale = (y: ScaleLinear): PlotAreaInterface => {
    yScale = y;
    return plotArea;
  };

  return plotArea;
};
