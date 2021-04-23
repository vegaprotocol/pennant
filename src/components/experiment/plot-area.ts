import { AreaElement, GridElement } from "../../elements";
import { ScaleLinear, ScaleTime } from "d3-scale";

export const plotArea = (
  x: ScaleTime<number, number, number | undefined | unknown>,
  y: ScaleLinear<number, number, number | undefined | unknown>
) => {
  let ctx: CanvasRenderingContext2D | null = null;
  let pixelRatio: number = 1;
  let gridline = new GridElement();
  let xScale: any = x.copy();
  let yScale: any = y.copy();

  /*   readonly points: [Date, number, number][];
  readonly fill: string | Gradient;
  readonly line: string | undefined; */

  const plotArea = (data: any[]) => {
    console.log(data);

    let area = new AreaElement({
      points: data.map((d) => [d.date, 0, d.open]),
      line: "#009cff",
      fill: {
        gradient: "linear",
        stops: [
          {
            offset: 0,
            color: "#044e80",
          },
          {
            offset: 1,
            color: "#000000",
          },
        ],
      },
    });

    if (ctx) {
      gridline.draw(ctx, xScale, yScale, pixelRatio);
      area.draw(ctx, xScale, yScale);
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
