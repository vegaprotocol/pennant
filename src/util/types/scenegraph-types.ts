import { RenderableHTMLElement } from "@ui/elements";

import { ScaleLinear, ScaleTime } from "./scales";

export interface RenderableElement {
  draw(
    ctx: CanvasRenderingContext2D,
    xScale: ScaleTime | null,
    yScale: ScaleLinear | null,
    pixelRatio?: number,
    ...rest: any[]
  ): void;
}

export interface PositionalElement extends RenderableElement {
  readonly x: Date;
}

export interface Pane {
  id: string;
  originalData: any[];
  renderableElements: RenderableElement[][];
  grid?: RenderableElement;
  axis?: RenderableElement;
  axisTooltip?: RenderableElement;
  crosshair?: RenderableElement;
  annotations?: RenderableElement[];
  labels?: RenderableHTMLElement[];
  labelLines?: RenderableElement[];

  /**
   * Fields to use to determine y axis extent
   */
  yEncodingFields: string[];
  yDomain?: [number, number];
}

export interface Scenegraph {
  panes: Pane[];
  xAxis: Pane;
}
