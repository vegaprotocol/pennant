import { Colors, clearCanvas } from "../../helpers";
import { CrosshairElement, GridElement } from "../../elements";
import { RenderableElement, ScaleLinear, ScaleTime } from "../../types";

import { extent } from "d3-array";

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

  const plotArea = () => {
    if (ctx) {
      clearCanvas(ctx.canvas, ctx, Colors.BACKGROUND);
      gridline.draw(ctx, xScale, yScale, pixelRatio);

      renderableElements.forEach((element) =>
        element.draw(ctx!, xScale, yScale, pixelRatio)
      );

      crosshair.draw(ctx, xScale, yScale, pixelRatio, position);
    }
  };

  plotArea.context = (context?: CanvasRenderingContext2D): any => {
    if (context) {
      ctx = context;
      return plotArea;
    } else {
      return ctx;
    }
  };

  plotArea.crosshair = (pos?: [number | null, number | null]): any => {
    if (pos) {
      position = pos;
      return plotArea;
    } else {
      return position;
    }
  };

  plotArea.data = (originalData: any[]): any => {
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

  plotArea.pixelRatio = (ratio?: number): any => {
    if (ratio) {
      pixelRatio = ratio;
      return plotArea;
    } else {
      return pixelRatio;
    }
  };

  plotArea.renderableElements = (elements: RenderableElement[]): any => {
    renderableElements = elements;
    return plotArea;
  };

  plotArea.xScale = (x?: ScaleTime): any => {
    if (x) {
      xScale = x.copy();

      return plotArea;
    } else {
      return xScale;
    }
  };

  plotArea.yEncodingFields = (fields: string[]): any => {
    yEncodingFields = fields;
    return plotArea;
  };

  plotArea.yScale = (y?: ScaleLinear): any => {
    if (y) {
      yScale = y;

      return plotArea;
    } else {
      return yScale;
    }
  };

  return plotArea;
};
