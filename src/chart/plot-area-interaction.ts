import { ScaleLinear, ScaleTime } from "../types";
import { Selection, pointers } from "d3-selection";
import { zoom as d3Zoom, zoomIdentity } from "d3-zoom";

import { dispatch } from "d3-dispatch";
import { mean } from "d3-array";
import { plotArea } from "./plot-area";

export interface plotAreaInteractionInterface {
  (selection: Selection<SVGSVGElement, any, any, any>): void;
  xScale(x: ScaleTime): plotAreaInteractionInterface;
  yScale(y: ScaleLinear): plotAreaInteractionInterface;
  on(
    typenames: string,
    callback: (this: object, ...args: any[]) => void
  ): plotAreaInteractionInterface;
}

export const plotAreaInteraction = (x: ScaleTime, y: ScaleLinear) => {
  let listeners = dispatch(
    "zoom",
    "zoomstart",
    "zoomend",
    "dblclick",
    "mousemove",
    "mouseout"
  );
  let xScale = x.copy();
  let yScale = y.copy();

  let zoom = d3Zoom<SVGSVGElement, unknown>()
    .filter(function filter(e) {
      if (e.type === "dblclick") {
        listeners.call("dblclick", plotAreaInteraction, e);
        return false;
      }

      return true;
    })
    .on("zoom", function (e) {
      const t = e.transform;
      const k = t.k / z.k;
      const point = center(e, this);

      listeners.call(
        "zoom",
        plotAreaInteraction,
        e,
        {
          x: t.x - z.x,
          y: t.y - z.y,
          k: k,
        },
        point
      );

      z = t;
    })
    .on("start", function () {
      listeners.call("zoomstart", plotArea);
    })
    .on("end", function (e) {
      listeners.call("zoomend", plotArea, [
        e.sourceEvent.offsetX,
        e.sourceEvent.offsetY,
      ]);
    });

  // z holds a copy of the previous transform, so we can track its changes
  let z = zoomIdentity;

  function center(event: any, target: any) {
    if (event.sourceEvent) {
      const p = pointers(event, target);
      return [mean(p, (d) => d[0]), mean(p, (d) => d[1])];
    }

    return [
      (xScale.range()[1] - xScale.range()[0]) / 2,
      (yScale.range()[0] - yScale.range()[1]) / 2,
    ];
  }

  const plotAreaInteraction = (
    selection: Selection<SVGSVGElement, any, any, any>
  ): void => {
    selection.call(zoom);

    selection
      .on("mousemove", (event) =>
        listeners.call("mousemove", plotAreaInteraction, [
          event.offsetX,
          event.offsetY,
        ])
      )
      .on("mouseout", () => listeners.call("mouseout", plotAreaInteraction));
  };

  plotAreaInteraction.xScale = (x: ScaleTime): plotAreaInteractionInterface => {
    xScale = x.copy();
    return plotAreaInteraction;
  };

  plotAreaInteraction.yScale = (
    y: ScaleLinear
  ): plotAreaInteractionInterface => {
    yScale = y;
    return plotAreaInteraction;
  };

  plotAreaInteraction.on = (
    typenames: string,
    callback: (this: object, ...args: any[]) => void
  ) => {
    listeners.on(typenames, callback);
    return plotAreaInteraction;
  };

  return plotAreaInteraction;
};
