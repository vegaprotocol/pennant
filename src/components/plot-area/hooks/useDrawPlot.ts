import { ScaleLinear, ScaleTime } from "d3-scale";
import { select } from "d3-selection";
import * as React from "react";
import { clearCanvas, Colors } from "../../../helpers";
import { FcElement, Panel } from "../../../types";

export function useDrawPlot(
  ref: React.MutableRefObject<FcElement>,
  scenegraph: Panel,
  x: ScaleTime<number, number, never>,
  y: ScaleLinear<number, number, never>,
  yOriginal: ScaleLinear<number, number, never>
) {
  React.useEffect(() => {
    select(ref.current)
      .on(
        "measure",
        (event: {
          detail: { height: number; width: number; pixelRatio: number };
        }) => {
          const { height, width, pixelRatio } = event.detail;

          x.range([0, width / pixelRatio]);
          y.range([height / pixelRatio, 0]);
          yOriginal.range([height / pixelRatio, 0]);
        }
      )
      .on(
        "draw",
        function drawPlotAreaVisualization(event: {
          detail: { child: HTMLCanvasElement; pixelRatio: number };
        }) {
          const { child, pixelRatio } = event.detail;
          const ctx = child.getContext("2d", { alpha: false });

          if (ctx) {
            ctx.save();
            ctx.scale(pixelRatio, pixelRatio);

            clearCanvas(child, ctx, Colors.BACKGROUND);

            if (scenegraph.grid) {
              scenegraph.grid.draw(ctx, x, y);
            }

            if (scenegraph.data) {
              for (const layer of scenegraph.data)
                for (const datum of layer) {
                  datum.draw(ctx, x, y);
                }
            }

            ctx.restore();
          }
        }
      );
  }, [scenegraph.data, scenegraph.grid, ref, x, y, yOriginal]);
}
