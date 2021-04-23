import { ScaleLinear, ScaleTime } from "d3-scale";

import { YAxisElement } from "../../elements";

export const yAxis = (
  x: ScaleTime<number, number, number | undefined | unknown>,
  y: ScaleLinear<number, number, number | undefined | unknown>
) => {
  let axis = new YAxisElement();
  let ctx: CanvasRenderingContext2D | null = null;
  let pixelRatio: number = 1;
  let xScale: any = x.copy();
  let yScale: any = y.copy();

  const yAxis = () => {
    if (ctx) {
      axis.draw(ctx, xScale, yScale, pixelRatio);
    }
  };

  yAxis.context = (context?: CanvasRenderingContext2D): any => {
    if (context) {
      ctx = context;
      return yAxis;
    } else {
      return context;
    }
  };

  yAxis.pixelRatio = (ratio?: number): any => {
    if (ratio) {
      pixelRatio = ratio;
      return yAxis;
    } else {
      return pixelRatio;
    }
  };

  yAxis.xScale = (x?: ScaleTime<number, number, number | undefined>): any => {
    if (x) {
      xScale = x.copy();

      return yAxis;
    } else {
      return xScale;
    }
  };

  yAxis.yScale = (y?: ScaleLinear<number, number, number>): any => {
    if (y) {
      yScale = y;

      return yAxis;
    } else {
      return yScale;
    }
  };

  return yAxis;
};
