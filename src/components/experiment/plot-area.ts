import {
  AreaElement,
  BarElement,
  GridElement,
  LineElement,
} from "../../elements";
import { ScaleLinear, ScaleTime } from "d3-scale";

import { Colors } from "../../helpers";

export const plotArea = (
  x: ScaleTime<number, number, number | undefined | unknown>,
  y: ScaleLinear<number, number, number | undefined | unknown>
) => {
  let ctx: CanvasRenderingContext2D | null = null;
  let pixelRatio: number = 1;
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
    }
  };

  plotArea.context = (context?: CanvasRenderingContext2D): any => {
    if (context) {
      ctx = context;
      return plotArea;
    } else {
      return yScale;
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

  plotArea.xScale = (
    x?: ScaleTime<number, number, number | undefined>
  ): any => {
    if (x) {
      xScale = x.copy();

      return plotArea;
    } else {
      return xScale;
    }
  };

  plotArea.yScale = (y?: ScaleLinear<number, number, unknown>): any => {
    if (y) {
      yScale = y;

      return plotArea;
    } else {
      return yScale;
    }
  };

  return plotArea;
};
