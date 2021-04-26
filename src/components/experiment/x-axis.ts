import { Colors, clearCanvas } from "../../helpers";
import { XAxisElement, XAxisTooltipElement } from "../../elements";

import { ScaleTime } from "../../types";

export interface xAxisInterface {
  (): void;
  context(context: CanvasRenderingContext2D): xAxisInterface;
  crosshair(position: number | null): xAxisInterface;
  pixelRatio(ratio: number): xAxisInterface;
  xScale(x: ScaleTime): xAxisInterface;
}

/**
 * The x-axis component renders human readable reference marks.
 * @param x
 * @returns
 */
export const xAxis = (x: ScaleTime) => {
  let axis = new XAxisElement();
  let tooltip = new XAxisTooltipElement();
  let ctx: CanvasRenderingContext2D | null = null;
  let position: number | null = null;
  let pixelRatio: number = 1;
  let xScale: any = x.copy();

  const xAxis: xAxisInterface = () => {
    if (ctx) {
      clearCanvas(ctx.canvas, ctx, Colors.BACKGROUND);
      axis.draw(ctx, xScale, null!, pixelRatio);
      tooltip.draw(ctx, xScale, null!, pixelRatio, position);
    }
  };

  xAxis.context = (context: CanvasRenderingContext2D): xAxisInterface => {
    ctx = context;
    return xAxis;
  };

  xAxis.crosshair = (pos: number | null): xAxisInterface => {
    position = pos;
    return xAxis;
  };

  xAxis.pixelRatio = (ratio: number): xAxisInterface => {
    pixelRatio = ratio;
    return xAxis;
  };

  xAxis.xScale = (x: ScaleTime): xAxisInterface => {
    xScale = x.copy();
    return xAxis;
  };

  return xAxis;
};
