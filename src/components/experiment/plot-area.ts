import {
  AreaElement,
  BarElement,
  CrosshairElement,
  GridElement,
  LineElement,
} from "../../elements";
import { ScaleLinear, ScaleTime } from "../../types";

import { Colors } from "../../helpers";

export const plotArea = (x: ScaleTime, y: ScaleLinear) => {
  let crosshair = new CrosshairElement();
  let ctx: CanvasRenderingContext2D | null = null;
  let pixelRatio: number = 1;
  let position: [number | null, number | null] = [null, null];
  let gridline = new GridElement();
  let xScale: any = x.copy();
  let yScale: any = y.copy();

  const plotArea = (data: any[]) => {
    let bars = data.map(
      (d) =>
        new BarElement({
          x: d.date,
          y: d.open,
          width: 1000 * 60 * 60 * 24 * 3,
          height: 50,
          fill: Colors.GREEN_DARK,
          stroke: Colors.GREEN,
        })
    );

    let lines = data.map(
      (d) =>
        new LineElement({
          points: [
            [d.date, d.open - 80],
            [d.date, d.open + 30],
          ],
          color: Colors.GREEN,
        })
    );

    if (ctx) {
      gridline.draw(ctx, xScale, yScale, pixelRatio);
      lines.forEach((line) => line.draw(ctx!, xScale, yScale, pixelRatio));
      bars.forEach((bar) => bar.draw(ctx!, xScale, yScale, pixelRatio));
      crosshair.draw(ctx, xScale, yScale, pixelRatio, position);
    }
  };

  plotArea.context = (context?: CanvasRenderingContext2D): any => {
    if (context) {
      ctx = context;
      return plotArea;
    } else {
      return ctx;
    }
  };

  plotArea.crosshair = (pos?: [number | null, number | null]): any => {
    if (pos) {
      position = pos;
      return plotArea;
    } else {
      return position;
    }
  };

  plotArea.pixelRatio = (ratio?: number): any => {
    if (ratio) {
      pixelRatio = ratio;
      return plotArea;
    } else {
      return pixelRatio;
    }
  };

  plotArea.xScale = (x?: ScaleTime): any => {
    if (x) {
      xScale = x.copy();

      return plotArea;
    } else {
      return xScale;
    }
  };

  plotArea.yScale = (y?: ScaleLinear): any => {
    if (y) {
      yScale = y;

      return plotArea;
    } else {
      return yScale;
    }
  };

  return plotArea;
};
