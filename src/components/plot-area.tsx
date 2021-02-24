import * as React from "react";

import { Colors, clearCanvas } from "../helpers";

import { CandleElement } from "../elements";
import { Element } from "../types/element";
import { FcElement } from "../types/d3fc-types";
import { bisector } from "d3-array";
import { closestIndexTo } from "date-fns";
import { select } from "d3-selection";

export type PlotAreaProps = {
  scenegraph: {
    crosshair: Element;
    data: Element[];
    grid: Element;
    yAxis: Element;
    yAxisTooltip: Element;
    annotations: Element[];
  };
  x: any;
  y: any;
  crosshairXRef: any;
  crosshairYRef: any;
  requestRedraw: () => void;
  onMouseMove: any;
  onMouseOut: any;
};

export const PlotArea = ({
  scenegraph,
  x,
  y,
  crosshairXRef,
  crosshairYRef,
  requestRedraw,
  onMouseMove,
  onMouseOut,
}: PlotAreaProps) => {
  const visualizationRef = React.useRef<FcElement>(null!);
  const foregroundRef = React.useRef<FcElement>(null!);

  React.useEffect(() => {
    select(visualizationRef.current)
      .on("measure", (event: { detail: { height: number; width: number } }) => {
        const { height, width } = event.detail;

        x.range([0, width]);
        y.range([height, 0]);
      })
      .on(
        "draw",
        (event: {
          detail: { child: HTMLCanvasElement; pixelRatio: number };
        }) => {
          const { child, pixelRatio } = event.detail;
          const ctx = child.getContext("2d");

          if (ctx) {
            ctx.save();
            ctx.scale(pixelRatio, pixelRatio);

            clearCanvas(child, ctx, Colors.BLACK);
            scenegraph.grid.draw(ctx, x, y);

            for (const datum of scenegraph.data) {
              datum.draw(ctx, x, y);
            }

            ctx.restore();
          }
        }
      );
  }, [scenegraph.data, scenegraph.grid, x, y]);

  React.useEffect(() => {
    const container = select<HTMLElement, unknown>(foregroundRef.current)
      .on("measure", (event: { detail: { height: number; width: number } }) => {
        const { height, width } = event.detail;

        x.range([0, width]);
        y.range([height, 0]);
      })
      .on(
        "draw",
        (event: {
          detail: { child: HTMLCanvasElement; pixelRatio: number };
        }) => {
          const { child, pixelRatio } = event.detail;
          const ctx = child.getContext("2d");

          if (ctx) {
            ctx.save();
            ctx.scale(pixelRatio, pixelRatio);

            scenegraph.yAxis.draw(ctx, x, y);

            for (const annotation of scenegraph.annotations) {
              annotation.draw(ctx, x, y);
            }

            scenegraph.crosshair.draw(ctx, x, y, [
              crosshairXRef.current,
              crosshairYRef.current,
            ]);

            scenegraph.yAxisTooltip.draw(ctx, x, y, [
              crosshairXRef.current,
              crosshairYRef.current,
            ]);

            ctx.restore();
          }
        }
      );

    container
      .on(
        "mousemove",
        (event: { offsetX: number; offsetY: number }) => {
          const data = scenegraph.data as CandleElement[];

          if (data.length > 0) {
            const { offsetX, offsetY } = event;
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
            crosshairYRef.current = offsetY;

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
    scenegraph.annotations,
    scenegraph.crosshair,
    scenegraph.data,
    scenegraph.yAxis,
    scenegraph.yAxisTooltip,
    x,
    y,
  ]);

  return (
    <>
      <d3fc-canvas
        ref={visualizationRef}
        class="d3fc-canvas-layer"
      ></d3fc-canvas>
      <d3fc-canvas
        ref={foregroundRef}
        class="d3fc-canvas-layer crosshair"
      ></d3fc-canvas>
    </>
  );
};
