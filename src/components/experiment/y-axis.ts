import { ScaleLinear, ScaleTime } from "d3-scale";
import { Selection, pointers } from "d3-selection";
import { zoom as d3Zoom, zoomIdentity } from "d3-zoom";

import { axisRight } from "d3-axis";
import { drag as d3Drag } from "d3-drag";
import { dispatch } from "d3-dispatch";
import { mean } from "d3-array";

export const yAxis = (y: ScaleLinear<number, number, number>) => {
  let listeners = dispatch("drag");

  let yScale = y;

  let drag = d3Drag<SVGSVGElement, unknown>().on("drag", function (e) {
    listeners.call("drag", yAxis, e);
  });

  function center(event: any, target: any) {
    if (event.sourceEvent) {
      const p = pointers(event, target);
      return [mean(p, (d) => d[0]), mean(p, (d) => d[1])];
    }

    return [(yScale.range()[0] - yScale.range()[1]) / 2];
  }

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
