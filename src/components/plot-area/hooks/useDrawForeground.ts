import * as React from "react";

import { FcElement, Panel } from "../../../types";
import { ScaleLinear, ScaleTime } from "d3-scale";

import { bisector } from "d3-array";
import { closestIndexTo } from "date-fns";
import { select } from "d3-selection";

export function useDrawForeground(
  foregroundRef: React.MutableRefObject<FcElement>,
  scenegraph: Panel,
  x: ScaleTime<number, number, never>,
  y: ScaleLinear<number, number, never>,
  crosshairXRef: any,
  crosshairYRef: any,
  panelIndex: number,
  isDragging: boolean,
  requestRedraw: any,
  onMouseMove: any,
  onMouseOut: any,
  onMouseOver: any
) {
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

          if (scenegraph.crosshair && !isDragging) {
            scenegraph.crosshair.draw(ctx, x, y, pixelRatio, [
              crosshairXRef.current,
              crosshairYRef.current[panelIndex],
            ]);
          }

          if (scenegraph.axisTooltip) {
            scenegraph.axisTooltip.draw(ctx, x, y, pixelRatio, [
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
      const data = scenegraph.originalData;

      if (data.length > 0) {
        const { offsetX, offsetY } = event;
        const timeAtMouseX = x.invert(offsetX);

        const index = bisector((d: any) => d.date).left(data, timeAtMouseX);

        const firstElement = data[index - 1];
        const secondElement = data[index];

        let element: any;
        let indexOffset = 0;

        if (firstElement && secondElement) {
          const nearestCandleDates = [firstElement.date, secondElement.date];
          indexOffset = closestIndexTo(timeAtMouseX, nearestCandleDates);
          element = [firstElement, secondElement][indexOffset];
        } else if (firstElement) {
          indexOffset = 0;
          element = firstElement;
        } else {
          indexOffset = 1;
          element = secondElement;
        }

        crosshairXRef.current = x(element.date);
        crosshairYRef.current[panelIndex] = offsetY;

        requestRedraw();
        callback?.(index + indexOffset - 1);
      }
    }

    container
      .on("mouseover", (event: { offsetX: number; offsetY: number }) => {
        handleMouse(event, onMouseOver);
      })
      .on("mousemove", (event: { offsetX: number; offsetY: number }) => {
        handleMouse(event, onMouseMove);
      })
      .on("mouseout", () => {
        crosshairXRef.current = null;
        crosshairYRef.current[panelIndex] = null;

        requestRedraw();
        onMouseOut?.();
      });
  }, [
    crosshairXRef,
    crosshairYRef,
    foregroundRef,
    isDragging,
    onMouseMove,
    onMouseOut,
    onMouseOver,
    panelIndex,
    requestRedraw,
    scenegraph,
    scenegraph.annotations,
    scenegraph.axis,
    scenegraph.axisTooltip,
    scenegraph.crosshair,
    scenegraph.originalData,
    x,
    y,
  ]);
}
