import { ScaleLinear, ScaleTime } from "d3-scale";

import React from "react";

export interface RenderableElement {
  draw(
    ctx: CanvasRenderingContext2D,
    xScale: ScaleTime<number, number, never>,
    yScale?: ScaleLinear<number, number, never>,
    ...rest: any[]
  ): void;
}

export interface PositionalElement extends RenderableElement {
  readonly x: Date;
}

export interface Panel {
  id: string;
  originalData: any[];
  data: PositionalElement[][];
  grid?: RenderableElement;
  axis?: RenderableElement;
  axisTooltip?: RenderableElement;
  crosshair?: RenderableElement;
  annotations?: RenderableElement[];

  /**
   * Fields to use to determine y axis extent
   */
  yEncodingFields?: string[];
  yDomain?: [number, number];
}

export interface Scenegraph {
  panels: Panel[];
  xAxis: Panel;
}
