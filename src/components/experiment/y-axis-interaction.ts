import { ScaleLinear } from "d3-scale";
import { Selection } from "d3-selection";
import { drag as d3Drag } from "d3-drag";
import { dispatch } from "d3-dispatch";

export const yAxisInteraction = (y: ScaleLinear<number, number, number | undefined>) => {
  let listeners = dispatch("drag");

  let yScale = y;

  let drag = d3Drag<SVGSVGElement, unknown>().on("drag", function (e) {
    listeners.call("drag", yAxisInteraction, e);
  });

  const yAxisInteraction = (selection: Selection<SVGSVGElement, any, any, any>) => {
    selection.call(drag);
  };

  yAxisInteraction.yScale = (y?: ScaleLinear<number, number, number>): any => {
    if (y) {
      yScale = y;

      return yAxisInteraction;
    } else {
      return yScale;
    }
  };

  yAxisInteraction.on = (
    typenames: string,
    callback?: (this: object, ...args: any[]) => void
  ) => {
    if (callback) {
      listeners.on(typenames, callback);
      return yAxisInteraction;
    } else {
      return listeners.on(typenames);
    }
  };

  return yAxisInteraction;
};
