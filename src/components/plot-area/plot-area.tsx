import * as React from "react";

import { Colors, clearCanvas } from "../../helpers";
import { ScaleLinear, ScaleTime } from "d3-scale";

import { FcElement } from "../../types/d3fc-types";
import { Panel } from "../../types/element";
import { PositionalElement } from "../../types/element";
import { bisector } from "d3-array";
import { closestIndexTo } from "date-fns";
import { select } from "d3-selection";
import { useWhyDidYouUpdate } from "../../hooks/useWhyDidYouUpdate";

export type PlotAreaProps = {
  scenegraph: Panel;
  x: ScaleTime<number, number, never>;
  y: ScaleLinear<number, number, never>;
  crosshairXRef: React.MutableRefObject<number | null>;
  index: number;
  crosshairYRef: React.MutableRefObject<(number | null)[]>;
  requestRedraw: () => void;
  onMouseMove?: (index: number) => void;
  onMouseOut?: () => void;
  onMouseOver?: (index: number) => void;
};

export const PlotArea = (props: PlotAreaProps) => {
  useWhyDidYouUpdate("PlotArea", props);

  const {
    scenegraph,
    x,
    y,
    crosshairXRef,
    index: panelIndex,
    crosshairYRef,
    requestRedraw,
    onMouseMove,
    onMouseOut,
    onMouseOver,
  } = props;

  const visualizationRef = React.useRef<FcElement>(null!);
  const foregroundRef = React.useRef<FcElement>(null!);

  React.useEffect(() => {
    select(visualizationRef.current)
      .on(
        "measure",
        (event: {
          detail: { height: number; width: number; pixelRatio: number };
        }) => {
          const { height, width, pixelRatio } = event.detail;

          x.range([0, width / pixelRatio]);
          y.range([height / pixelRatio, 0]);
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

            clearCanvas(child, ctx, Colors.BLACK);

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
  }, [scenegraph.data, scenegraph.grid, x, y]);

  React.useEffect(() => {
    const container = select<HTMLElement, unknown>(foregroundRef.current).on(
      "draw",
      function drawPlotAreaForeground(event: {
        detail: { child: HTMLCanvasElement; pixelRatio: number };
      }) {
        const { child, pixelRatio } = event.detail;
        const ctx = child.getContext("2d");

        if (ctx) {
          ctx.save();
          ctx.scale(pixelRatio, pixelRatio);

          if (scenegraph.axis) {
            scenegraph.axis.draw(ctx, x, y);
          }

          if (scenegraph.annotations) {
            for (const annotation of scenegraph.annotations) {
              annotation.draw(ctx, x, y);
            }
          }

          if (scenegraph.crosshair) {
            scenegraph.crosshair.draw(ctx, x, y, [
              crosshairXRef.current,
              crosshairYRef.current[panelIndex],
            ]);
          }

          if (scenegraph.axisTooltip) {
            scenegraph.axisTooltip.draw(ctx, x, y, [
              crosshairXRef.current,
              crosshairYRef.current[panelIndex],
            ]);
          }

          ctx.restore();
        }
      }
    );

    function handleMouse(
      event: { offsetX: number; offsetY: number },
      callback?: (index: number) => void
    ) {
      const data = scenegraph.data[0];

      if (data.length > 0) {
        const { offsetX, offsetY } = event;
        const timeAtMouseX = x.invert(offsetX);

        const index = bisector((d: PositionalElement) => d.x).left(
          data,
          timeAtMouseX
        );

        const firstElement = data[index - 1];
        const secondElement = data[index];

        let element: PositionalElement;
        let indexOffset = 0;

        if (firstElement && secondElement) {
          const nearestCandleDates = [firstElement.x, secondElement.x];
          indexOffset = closestIndexTo(timeAtMouseX, nearestCandleDates);
          element = [firstElement, secondElement][indexOffset];
        } else if (firstElement) {
          indexOffset = 0;
          element = firstElement;
        } else {
          indexOffset = 1;
          element = secondElement;
        }

        crosshairXRef.current = x(element.x);
        crosshairYRef.current[panelIndex] = offsetY;

        requestRedraw();
        callback?.(index + indexOffset - 1);
      }
    }

    container
      .on("mouseover", (event: { offsetX: number; offsetY: number }) => {
        handleMouse(event, onMouseOver);
      })
      .on(
        "mousemove",
        (event: { offsetX: number; offsetY: number }) => {
          handleMouse(event, onMouseMove);
        },
        { capture: true } // TODO: It would be preferable to still respond to this event while zooming
      )
      .on("mouseout", () => {
        crosshairXRef.current = null;
        crosshairYRef.current[panelIndex] = null;

        requestRedraw();
        onMouseOut?.();
      });
  }, [
    crosshairXRef,
    crosshairYRef,
    panelIndex,
    onMouseMove,
    onMouseOut,
    onMouseOver,
    requestRedraw,
    scenegraph.annotations,
    scenegraph.axis,
    scenegraph.axisTooltip,
    scenegraph.crosshair,
    scenegraph.data,
    x,
    y,
  ]);

  return (
    <>
      <d3fc-canvas
        ref={visualizationRef}
        class="d3fc-canvas-layer"
        use-device-pixel-ratio
      ></d3fc-canvas>
      <d3fc-canvas
        ref={foregroundRef}
        class="d3fc-canvas-layer crosshair"
        use-device-pixel-ratio
      ></d3fc-canvas>
      <div className="annotation-layer"></div>
    </>
  );
};
