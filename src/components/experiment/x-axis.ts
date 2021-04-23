import { ScaleLinear, ScaleTime } from "d3-scale";

import { Selection } from "d3-selection";
import { XAxisElement } from "../../elements";
import { axisBottom } from "d3-axis";

/**
 * The x-axis component renders human readable reference marks.
 * @param x
 * @returns
 */
export const xAxis = (
  x: ScaleTime<number, number, number | undefined | unknown>
) => {
  let axis = new XAxisElement();
  let ctx: CanvasRenderingContext2D | null = null;
  let pixelRatio: number = 1;
  let xScale: any = x.copy();

  const xAxis = () => {
    if (ctx) {
      axis.draw(ctx, xScale, null!, pixelRatio);
    }
  };

  xAxis.context = (context?: CanvasRenderingContext2D): any => {
    if (context) {
      ctx = context;
      return xAxis;
    } else {
      return context;
    }
  };

  xAxis.pixelRatio = (ratio?: number): any => {
    if (ratio) {
      pixelRatio = ratio;
      return xAxis;
    } else {
      return pixelRatio;
    }
  };

  xAxis.xScale = (x?: ScaleTime<number, number, number | undefined>): any => {
    if (x) {
      xScale = x.copy();
      return xAxis;
    } else {
      return xScale;
    }
  };

  return xAxis;
};
