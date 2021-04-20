import { ScaleLinear, ScaleTime } from "d3-scale";
import { Selection, pointers } from "d3-selection";
import { axisBottom, axisRight } from "d3-axis";
import { zoom as d3Zoom, zoomIdentity } from "d3-zoom";

import { drag as d3Drag } from "d3-drag";
import { dispatch } from "d3-dispatch";
import { mean } from "d3-array";

export const xAxis = (x: ScaleLinear<number, number, number>) => {
  let listeners = dispatch("drag");

  let xScale = x;

  let drag = d3Drag<SVGSVGElement, unknown>().on("drag", function (e) {
    listeners.call("drag", xAxis, e);
  });

  function center(event: any, target: any) {
    if (event.sourceEvent) {
      const p = pointers(event, target);
      return [mean(p, (d) => d[0]), mean(p, (d) => d[1])];
    }

    return [(xScale.range()[0] - xScale.range()[1]) / 2];
  }

  const xAxis = (selection: Selection<SVGSVGElement, any, any, any>) => {
    selection.call(axisBottom(xScale));
    selection.call(drag);
  };

  xAxis.xScale = (x?: ScaleLinear<number, number, number>): any => {
    if (x) {
      xScale = x;

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
