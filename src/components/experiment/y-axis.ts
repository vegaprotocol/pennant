import { ScaleLinear, ScaleTime } from "../../types";
import { YAxisElement, YAxisTooltipElement } from "../../elements";

export interface yAxisInterface {
  (): void;
  context(context: CanvasRenderingContext2D): yAxisInterface;
  pixelRatio(ratio: number): yAxisInterface;
  yScale(y: ScaleLinear): yAxisInterface;
}

export const yAxis = (x: ScaleTime, y: ScaleLinear) => {
  let axis = new YAxisElement();
  let ctx: CanvasRenderingContext2D | null = null;
  let pixelRatio: number = 1;
  let position: number | null = null;
  let tooltip = new YAxisTooltipElement(5); // FIXME: Use correct formatting
  let xScale = x.copy();
  let yScale = y.copy();

  const yAxis = () => {
    if (ctx) {
      axis.draw(ctx, xScale, yScale, pixelRatio);
      tooltip.draw(ctx, xScale, yScale, pixelRatio, position);
    }
  };

  yAxis.context = (context: CanvasRenderingContext2D): yAxisInterface => {
    ctx = context;
    return yAxis;
  };

  yAxis.crosshair = (pos: number | null): yAxisInterface => {
    position = pos;
    return yAxis;
  };

  yAxis.pixelRatio = (ratio: number): yAxisInterface => {
    pixelRatio = ratio;
    return yAxis;
  };

  yAxis.xScale = (x: ScaleTime): yAxisInterface => {
    xScale = x.copy();

    return yAxis;
  };

  yAxis.yScale = (y: ScaleLinear): yAxisInterface => {
    yScale = y.copy();
    return yAxis;
  };

  return yAxis;
};
