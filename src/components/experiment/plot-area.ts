import { ScaleLinear, ScaleTime } from "d3-scale";

// @ts-ignore
import { annotationCanvasGridline } from "@d3fc/d3fc-annotation";
import { dispatch } from "d3-dispatch";
import { mean } from "d3-array";

export const plotArea = (
  x: ScaleTime<number, number, number | undefined>,
  y: ScaleLinear<number, number, unknown>
) => {
  let listeners = dispatch("zoom", "dblclick");
  let ctx: CanvasRenderingContext2D | null = null;
  let gridline = annotationCanvasGridline().xScale(x).yScale(y);
  let xScale = x.copy();
  let yScale = y.copy();

  function draw() {
    gridline();
  }

  const plotArea = () => {
    gridline.context(ctx);
    gridline();
  };

  plotArea.xScale = (
    x?: ScaleTime<number, number, number | undefined>
  ): any => {
    if (x) {
      gridline.xScale(x);
      xScale = x.copy();

      return plotArea;
    } else {
      return xScale;
    }
  };

  plotArea.context = (context?: CanvasRenderingContext2D): any => {
    if (context) {
      ctx = context;

      return plotArea;
    } else {
      return yScale;
    }
  };

  plotArea.yScale = (y?: ScaleLinear<number, number, unknown>): any => {
    if (y) {
      gridline.yScale(y);
      yScale = y;

      return plotArea;
    } else {
      return yScale;
    }
  };

  plotArea.on = (
    typenames: string,
    callback?: (this: object, ...args: any[]) => void
  ) => {
    if (callback) {
      listeners.on(typenames, callback);
      return plotArea;
    } else {
      return listeners.on(typenames);
    }
  };

  return plotArea;
};
