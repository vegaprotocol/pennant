import { ScaleLinear } from "d3-scale";
import { Selection } from "d3-selection";
import { axisRight } from "d3-axis";
import { drag as d3Drag } from "d3-drag";
import { dispatch } from "d3-dispatch";

export const yAxis = (y: ScaleLinear<number, number, number | undefined>) => {
  let listeners = dispatch("drag");

  let yScale = y;

  let drag = d3Drag<SVGSVGElement, unknown>().on("drag", function (e) {
    listeners.call("drag", yAxis, e);
  });

  const yAxis = (selection: Selection<SVGSVGElement, any, any, any>) => {
    selection.call(axisRight(yScale));
    selection.call(drag);
  };

  yAxis.yScale = (y?: ScaleLinear<number, number, number>): any => {
    if (y) {
      yScale = y;

      return yAxis;
    } else {
      return yScale;
    }
  };

  yAxis.on = (
    typenames: string,
    callback?: (this: object, ...args: any[]) => void
  ) => {
    if (callback) {
      listeners.on(typenames, callback);
      return yAxis;
    } else {
      return listeners.on(typenames);
    }
  };

  return yAxis;
};
