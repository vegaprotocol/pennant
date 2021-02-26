import * as React from "react";

import { Colors, clearCanvas } from "../helpers";
import { ScaleLinear, ScaleTime } from "d3-scale";

import { FcElement } from "../types/d3fc-types";
import { Panel } from "../types/element";
import { PositionalElement } from "../types/element";
import { bisector } from "d3-array";
import { closestIndexTo } from "date-fns";
import { select } from "d3-selection";

export type XAxisProps = {
  scenegraph: Panel;
  x: ScaleTime<number, number, never>;
  y: ScaleLinear<number, number, never>;
  crosshairXRef: React.MutableRefObject<number | null>;
  requestRedraw: () => void;
  onMouseMove?: (index: number) => void;
  onMouseOut?: () => void;
  onMouseOver?: (index: number) => void;
};

export const XAxis = ({
  scenegraph,
  x,
  y,
  crosshairXRef,
  requestRedraw,
  onMouseMove,
  onMouseOut,
  onMouseOver,
}: XAxisProps) => {
  const visualizationRef = React.useRef<FcElement>(null!);

  // X axis
  React.useEffect(() => {
    const container = select<HTMLElement, unknown>(visualizationRef.current).on(
      "draw",
      (event: { detail: { child: HTMLCanvasElement; pixelRatio: number } }) => {
        const { child, pixelRatio } = event.detail;
        const ctx = child.getContext("2d", { alpha: false });
        if (ctx) {
          ctx.save();
          ctx.scale(pixelRatio, pixelRatio);

          clearCanvas(child, ctx, Colors.BLACK);

          if (scenegraph.axis) {
            scenegraph.axis.draw(ctx, x, y);
          }

          if (scenegraph.axisTooltip) {
            scenegraph.axisTooltip.draw(ctx, x, y, [
              crosshairXRef.current,
              null,
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
        const { offsetX } = event;
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

        requestRedraw();
        onMouseOut?.();
      });
  }, [
    crosshairXRef,
    onMouseMove,
    onMouseOut,
    onMouseOver,
    requestRedraw,
    scenegraph.axis,
    scenegraph.axisTooltip,
    scenegraph.data,
    x,
    y,
  ]);

  return (
    <>
      <d3fc-canvas
        ref={visualizationRef}
        class="time-axis"
        use-device-pixel-ratio
      ></d3fc-canvas>
    </>
  );
};
