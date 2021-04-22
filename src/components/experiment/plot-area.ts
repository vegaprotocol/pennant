import { ScaleLinear, ScaleTime } from "d3-scale";

import { GridElement } from "../../elements";

export const plotArea = (
  x: ScaleTime<number, number, number | undefined | unknown>,
  y: ScaleLinear<number, number, number | undefined | unknown>
) => {
  let ctx: CanvasRenderingContext2D | null = null;
  let pixelRatio: number = 1;
  let gridline = new GridElement();
  let xScale: any = x.copy();
  let yScale: any = y.copy();

  const plotArea = () => {
    ctx && gridline.draw(ctx, xScale, yScale, pixelRatio);
  };

  plotArea.context = (context?: CanvasRenderingContext2D): any => {
    if (context) {
      ctx = context;
      return plotArea;
    } else {
      return yScale;
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

  plotArea.xScale = (
    x?: ScaleTime<number, number, number | undefined>
  ): any => {
    if (x) {
      xScale = x.copy();

      return plotArea;
    } else {
      return xScale;
    }
  };

  plotArea.yScale = (y?: ScaleLinear<number, number, unknown>): any => {
    if (y) {
      yScale = y;

      return plotArea;
    } else {
      return yScale;
    }
  };

  return plotArea;
};
