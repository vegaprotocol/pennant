import { ScaleLinear } from "../types";
import { Selection } from "d3-selection";
import { drag as d3Drag } from "d3-drag";
import { dispatch } from "d3-dispatch";

export interface yAxisInteractionInterface {
  (selection: Selection<SVGSVGElement, any, any, any>): void;
  yScale(y: ScaleLinear): yAxisInteractionInterface;
  on(
    typenames: string,
    callback: (this: object, ...args: any[]) => void
  ): yAxisInteractionInterface;
}

/**
 * The y-axis interaction component handles dragging interactions.
 */
export const yAxisInteraction = (y: ScaleLinear) => {
  let listeners = dispatch("drag");

  let yScale = y;

  let drag = d3Drag<SVGSVGElement, unknown>().on("drag", function (e) {
    listeners.call("drag", yAxisInteraction, e);
  });

  const yAxisInteraction = (
    selection: Selection<SVGSVGElement, any, any, any>
  ) => {
    selection.call(drag);
  };

  yAxisInteraction.yScale = (y: ScaleLinear): any => {
    yScale = y;
    return yAxisInteraction;
  };

  yAxisInteraction.on = (
    typenames: string,
    callback: (this: object, ...args: any[]) => void
  ): yAxisInteractionInterface => {
    listeners.on(typenames, callback);
    return yAxisInteraction;
  };

  return yAxisInteraction;
};
