import { Colors, clearCanvas } from "../../helpers";
import { CrosshairElement, GridElement } from "../../elements";
import { RenderableElement, ScaleLinear, ScaleTime } from "../../types";

export const plotArea = (
  x: ScaleTime,
  y: ScaleLinear,
  elements: RenderableElement[]
) => {
  let crosshair = new CrosshairElement();
  let ctx: CanvasRenderingContext2D | null = null;
  let gridline = new GridElement();
  let pixelRatio: number = 1;
  let position: [number | null, number | null] = [null, null];
  let renderableElements: RenderableElement[] = elements;
  let xScale = x.copy();
  let yScale = y.copy();

  const plotArea = () => {
    if (ctx) {
      console.log(xScale.domain(), yScale.domain());

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
