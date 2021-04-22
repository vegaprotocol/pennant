import { ScaleLinear, ScaleTime } from "d3-scale";
import { Selection, pointers } from "d3-selection";
import { zoom as d3Zoom, zoomIdentity } from "d3-zoom";

// @ts-ignore
import { annotationSvgGridline } from "@d3fc/d3fc-annotation";
import { dispatch } from "d3-dispatch";
import { mean } from "d3-array";

export const plotArea = (
  x: ScaleLinear<number, number, unknown>,
  y: ScaleLinear<number, number, unknown>
) => {
  let listeners = dispatch("zoom", "dblclick");
  let gridline = annotationSvgGridline().xScale(x).yScale(y);
  let xScale = x.copy();
  let yScale = y.copy();

  let zoom = d3Zoom<SVGSVGElement, unknown>()
    .filter(function filter(e) {
      if (e.type === "dblclick") {
        listeners.call("dblclick", plotArea, e);
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
        plotArea,
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

  const plotArea = (selection: Selection<SVGSVGElement, any, any, any>) => {
    selection.call(gridline);
    selection.call(zoom);
  };

  plotArea.xScale = (x?: ScaleLinear<number, number, unknown>): any => {
    if (x) {
      gridline.xScale(x);
      xScale = x;

      return plotArea;
    } else {
      return xScale;
    }
  };

  plotArea.yScale = (y?: ScaleLinear<number, number, unknown>): any => {
    if (y) {
      gridline.yScale(y);
      yScale = y;

      return plotArea;
    } else {
      return yScale;
    }
  };

  plotArea.on = (
    typenames: string,
    callback?: (this: object, ...args: any[]) => void
  ) => {
    if (callback) {
      listeners.on(typenames, callback);
      return plotArea;
    } else {
      return listeners.on(typenames);
    }
  };

  return plotArea;
};
