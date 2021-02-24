import { ScaleLinear, ScaleTime } from "d3-scale";

export interface Element {
  draw(
    ctx: CanvasRenderingContext2D,
    xScale: ScaleTime<number, number, never>,
    yScale: ScaleLinear<number, number, never>,
    ...rest: any[]
  ): void;
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
  data?: Element[];
  grid?: Element;
  axis?: Element;
  axisTooltip?: Element;
  crosshair?: Element;
  annotations?: Element[];
}

export interface Scenegraph {
  plot: Panel;
  study: Panel;
  xAxis: Panel;
}
