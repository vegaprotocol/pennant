import { ScaleLinear, ScaleTime } from "d3-scale";
import { Selection, pointers } from "d3-selection";
import { zoom as d3Zoom, zoomIdentity } from "d3-zoom";

import { dispatch } from "d3-dispatch";
import { mean } from "d3-array";

export const plotAreaInteraction = (
  x: ScaleTime<number, number, number | undefined>,
  y: ScaleLinear<number, number, unknown>
) => {
  let listeners = dispatch("zoom", "dblclick");
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
  ) => {
    selection.call(zoom);
  };

  plotAreaInteraction.xScale = (
    x?: ScaleTime<number, number, number | undefined>
  ): any => {
    if (x) {
      xScale = x.copy();

      return plotAreaInteraction;
    } else {
      return xScale;
    }
  };

  plotAreaInteraction.yScale = (
    y?: ScaleLinear<number, number, unknown>
  ): any => {
    if (y) {
      yScale = y;

      return plotAreaInteraction;
    } else {
      return yScale;
    }
  };

  plotAreaInteraction.on = (
    typenames: string,
    callback?: (this: object, ...args: any[]) => void
  ) => {
    if (callback) {
      listeners.on(typenames, callback);
      return plotAreaInteraction;
    } else {
      return listeners.on(typenames);
    }
  };

  return plotAreaInteraction;
};
