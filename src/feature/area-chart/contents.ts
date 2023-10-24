import { HorizontalGrid, VerticalGrid } from "@ui/display-objects";
import { Container, Renderer } from "@ui/renderer";
import { AXIS_HEIGHT, AXIS_WIDTH } from "@util/constants";
import { range } from "@util/misc";
import { ScaleLinear, ScaleTime } from "@util/types";

import { SeriesData } from "./chart";
import { AreaCurve } from "./display-objects/area-curve";
import { Colors } from "./helpers";

type ContentsColors = Pick<
  Colors,
  | "accent1"
  | "accent2"
  | "accent3"
  | "accent4"
  | "accent5"
  | "accent6"
  | "backgroundSurface"
  | "emphasis100"
  | "positiveFill"
  | "positiveStroke"
  | "negativeFill"
  | "negativeStroke"
>;

/**
 * Responsible for drawing area curves for depth chart.
 */
export class Contents {
  public stage: Container = new Container();
  public renderer: Renderer;
  public horizontalGrid: HorizontalGrid;
  public verticalgrid: VerticalGrid;
  public series: AreaCurve[];
  public colors: ContentsColors;

  constructor(options: {
    view: HTMLCanvasElement;
    resolution: number;
    width: number;
    height: number;
    colors: ContentsColors;
  }) {
    this.renderer = new Renderer({
      view: options.view,
      resolution: options.resolution,
      width: options.width,
      height: options.height,
    });

    this.colors = options.colors;

    this.horizontalGrid = new HorizontalGrid(this.colors.emphasis100);
    this.verticalgrid = new VerticalGrid(this.colors.emphasis100);
    this.series = range(0, 5).map(() => new AreaCurve());

    this.stage.addChild(this.horizontalGrid);
    this.stage.addChild(this.verticalgrid);
    this.stage.addChild(...this.series);
  }

  public render(): void {
    this.renderer.render(this.stage);
  }

  public update(
    priceScale: ScaleLinear,
    timeScale: ScaleTime,
    data: SeriesData,
    height: number,
  ): void {
    const resolution = this.renderer.resolution;

    this.horizontalGrid.update(
      timeScale,
      this.renderer.width,
      this.renderer.height - resolution * AXIS_HEIGHT,
      resolution,
    );

    this.verticalgrid.update(
      priceScale,
      this.renderer.width - resolution * AXIS_WIDTH,
      this.renderer.height,
      resolution,
    );

    for (let i = 0; i < this.series.length; i++) {
      if (i < data.length) {
        this.series[i].visible = true;
        this.series[i].update(
          data[i].map((d, j) => [
            timeScale(data[i].i[j]) as number,
            priceScale(d[0]),
            priceScale(d[1]),
          ]),
          height,
          resolution,
          undefined,
          (this.colors as any)[`accent${i + 1}`],
          this.colors.backgroundSurface,
        );

        this.series[i].visible = true;
      } else {
        this.series[i].visible = false;
      }
    }
  }
}
