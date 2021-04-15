import "./plot-area.scss";

import * as React from "react";

import { FcElement, Panel } from "../../types";
import { ScaleLinear, ScaleTime } from "d3-scale";

import { useDrawPlot } from "./hooks/useDrawPlot";
import { useDrawForeground } from "./hooks/useDrawForeground";
import { select } from "d3-selection";
import { drag } from "d3-drag";

export type PlotAreaProps = {
  scenegraph: Panel;
  x: ScaleTime<number, number, never>;
  y: ScaleLinear<number, number, never>;
  yOriginal: ScaleLinear<number, number, never>;
  crosshairXRef: React.MutableRefObject<number | null>;
  index: number;
  crosshairYRef: React.MutableRefObject<(number | null)[]>;
  isDragging: React.MutableRefObject<boolean>;
  overlay?: React.ReactNode;
  requestRedraw: () => void;
  onMouseMove?: (index: number) => void;
  onMouseOut?: () => void;
  onMouseOver?: (index: number) => void;
};

export const PlotArea = ({
  scenegraph,
  x,
  y,
  yOriginal,
  crosshairXRef,
  index: panelIndex,
  crosshairYRef,
  isDragging,
  overlay,
  requestRedraw,
  onMouseMove,
  onMouseOut,
  onMouseOver,
}: PlotAreaProps) => {
  const visualizationRef = React.useRef<FcElement>(null!);
  const foregroundRef = React.useRef<FcElement>(null!);
  const axisInteractionRef = React.useRef<HTMLDivElement>(null!);

  useDrawPlot(visualizationRef, scenegraph, x, y, yOriginal);

  useDrawForeground(
    foregroundRef,
    scenegraph,
    x,
    y,
    crosshairXRef,
    crosshairYRef,
    panelIndex,
    isDragging.current,
    requestRedraw,
    onMouseMove,
    onMouseOut,
    onMouseOver
  );

  React.useEffect(() => {
    select(axisInteractionRef.current).call(
      drag<HTMLDivElement, unknown>()
        .on("start", () => {})
        .on("drag", (event) => {
          const dy = event.dy;
          const height = Math.abs(y.range()[1] - y.range()[0]);
        })
        .on("end", () => console.log("end"))
    );
  }, [y]);

  return (
    <>
      <d3fc-canvas
        ref={visualizationRef}
        class="d3fc-canvas-layer base"
        use-device-pixel-ratio
      ></d3fc-canvas>
      <d3fc-canvas
        ref={foregroundRef}
        class="d3fc-canvas-layer foreground crosshair"
        use-device-pixel-ratio
      ></d3fc-canvas>
      <div className="annotation-layer"></div>
      <div ref={axisInteractionRef} className="axis-interaction"></div>
      {overlay && <div className="overlay-layer">{overlay}</div>}
    </>
  );
};
