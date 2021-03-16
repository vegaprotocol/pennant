import { ScaleLinear, ScaleTime } from "d3-scale";

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

export interface CandleDetailsExtended {
  datetime: string;
  date: Date;
  high: number;
  low: number;
  open: number;
  close: number;
  volume: number;
}

export interface Panel {
  id: string;
  data: PositionalElement[][];
  grid?: RenderableElement;
  axis?: RenderableElement;
  axisTooltip?: RenderableElement;
  crosshair?: RenderableElement;
  annotations?: RenderableElement[];
  yEncodingFields?: string[];
}

export interface Scenegraph {
  panels: Panel[];
  xAxis: Panel;
}
