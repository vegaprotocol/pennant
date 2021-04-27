import { ScaleTime } from "../types";
import { Selection } from "d3-selection";
import { drag as d3Drag } from "d3-drag";
import { dispatch } from "d3-dispatch";

export interface xAxisInteractionInterface {
  (selection: Selection<SVGSVGElement, any, any, any>): void;
  xScale(x: ScaleTime): xAxisInteractionInterface;
  on(
    typenames: string,
    callback: (this: object, ...args: any[]) => void
  ): xAxisInteractionInterface;
}

/**
 * The x-axis component renders human readable reference marks.
 * @param x
 * @returns
 */
export const xAxisInteraction = (x: ScaleTime) => {
  let listeners = dispatch("drag");
  let xScale = x.copy();

  let drag = d3Drag<SVGSVGElement, unknown>().on("drag", function (e) {
    listeners.call("drag", xAxisInteraction, e);
  });

  const xAxisInteraction: xAxisInteractionInterface = (
    selection: Selection<SVGSVGElement, any, any, any>
  ) => {
    selection.call(drag);
  };

  xAxisInteraction.xScale = (x: ScaleTime): xAxisInteractionInterface => {
    xScale = x.copy();
    return xAxisInteraction;
  };

  xAxisInteraction.on = (
    typenames: string,
    callback: (this: object, ...args: any[]) => void
  ): xAxisInteractionInterface => {
    listeners.on(typenames, callback);
    return xAxisInteraction;
  };

  return xAxisInteraction;
};
