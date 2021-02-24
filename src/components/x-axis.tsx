import * as React from "react";

import { Colors, clearCanvas } from "../helpers";

import { CandleElement } from "../elements";
import { Element } from "../types/element";
import { FcElement } from "../types/d3fc-types";
import { bisector } from "d3-array";
import { closestIndexTo } from "date-fns";
import { select } from "d3-selection";

export type XAxisProps = {
  scenegraph: {
    data: Element[];
    axis: Element;
    tooltip: Element;
  };
  x: any;
  y: any;
  crosshairXRef: any;
  crosshairYRef: any;
  requestRedraw: () => void;
  onMouseMove: any;
  onMouseOut: any;
};

export const XAxis = ({
  scenegraph,
  x,
  y,
  crosshairXRef,
  crosshairYRef,
  requestRedraw,
  onMouseMove,
  onMouseOut,
}: XAxisProps) => {
  const visualizationRef = React.useRef<FcElement>(null!);

  // X axis
  React.useEffect(() => {
    const container = select<HTMLElement, unknown>(visualizationRef.current).on(
      "draw",
      (event: { detail: { child: HTMLCanvasElement; pixelRatio: number } }) => {
        const { child, pixelRatio } = event.detail;
        const ctx = child.getContext("2d");
        if (ctx) {
          ctx.save();
          ctx.scale(pixelRatio, pixelRatio);
          clearCanvas(child, ctx, Colors.BLACK);
          scenegraph.axis.draw(ctx, x, y);
          scenegraph.tooltip.draw(ctx, x, y, [crosshairXRef.current, null]);
          ctx.restore();
        }
      }
    );

    container
      .on(
        "mousemove",
        (event: { offsetX: number }) => {
          const data = scenegraph.data as CandleElement[];

          if (data.length > 0) {
            const { offsetX } = event;
            const timeAtMouseX = x.invert(offsetX);

            const index = bisector((d: CandleElement) => d.x).left(
              data,
              timeAtMouseX
            );

            const firstCandle = data[index - 1];
            const secondCandle = data[index];

            let candle: CandleElement;
            let indexOffset = 0;

            if (firstCandle && secondCandle) {
              const nearestCandleDates = [firstCandle.x, secondCandle.x];
              indexOffset = closestIndexTo(timeAtMouseX, nearestCandleDates);
              candle = [firstCandle, secondCandle][indexOffset];
            } else if (firstCandle) {
              candle = firstCandle;
            } else {
              candle = secondCandle;
            }

            crosshairXRef.current = x(candle.x);
            crosshairYRef.current = null;

            requestRedraw();
            onMouseMove(index + indexOffset - 1);
          }
        },
        { capture: true } // TODO: It would be preferable to still respond to this event while zooming
      )
      .on("mouseout", () => {
        crosshairXRef.current = null;
        crosshairYRef.current = null;

        requestRedraw();
        onMouseOut();
      });
  }, [
    crosshairXRef,
    crosshairYRef,
    onMouseMove,
    onMouseOut,
    requestRedraw,
    scenegraph.axis,
    scenegraph.data,
    scenegraph.tooltip,
    x,
    y,
  ]);

  return (
    <>
      <d3fc-canvas ref={visualizationRef} class="time-axis"></d3fc-canvas>
    </>
  );
};
