import { NumberValue, ScaleLinear, ScaleTime, scaleLinear } from "d3-scale";

import { Selection } from "d3-selection";
import { axisBottom } from "d3-axis";
import { drag as d3Drag } from "d3-drag";
import { dispatch } from "d3-dispatch";

export const xAxis = (x: ScaleTime<number, number, number | undefined>) => {
  let listeners = dispatch("drag");
  let xScale = x.copy();

  let drag = d3Drag<SVGSVGElement, unknown>().on("drag", function (e) {
    listeners.call("drag", xAxis, e);
  });

  const xAxis = (selection: Selection<SVGSVGElement, any, any, any>) => {
    const axis = axisBottom<Date>(xScale);

    console.log(axis);
    selection.call(axis);
    selection.call(drag);
  };

  xAxis.xScale = (x?: ScaleTime<number, number, number | undefined>): any => {
    if (x) {
      xScale = x.copy();
      return xAxis;
    } else {
      return xScale;
    }
  };

  xAxis.on = (
    typenames: string,
    callback?: (this: object, ...args: any[]) => void
  ) => {
    if (callback) {
      listeners.on(typenames, callback);
      return xAxis;
    } else {
      return listeners.on(typenames);
    }
  };

  return xAxis;
};
function scaleDate<T, U, V>(): import("d3-axis").AxisScale<Date> {
  throw new Error("Function not implemented.");
}
