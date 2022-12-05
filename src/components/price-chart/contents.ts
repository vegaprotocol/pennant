import { range } from "../../helpers";
import { Renderer } from "../../renderer";
import { Container } from "../../renderer/display";
import { ScaleLinear, ScaleTime } from "../../types";
import { AXIS_HEIGHT } from "../depth-chart";
import { AXIS_WIDTH } from "./chart";
import { Area, HorizontalGrid, VerticalGrid } from "./display-objects";
import { Colors } from "./helpers";

type ContentsColors = Pick<
  Colors,
  "backgroundSurface" | "buyFill" | "buyStroke" | "sellFill" | "sellStroke"
>;

/**
 * Responsible for drawing area curves for depth chart.
 */
export class Contents {
  public stage: Container = new Container();
  public renderer: Renderer;

  public horizontalGrid: HorizontalGrid;
  public verticalgrid: VerticalGrid;

  public series: Area[];

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

    this.horizontalGrid = new HorizontalGrid();
    this.verticalgrid = new VerticalGrid();
    this.series = range(0, 6).map((index) => new Area(options.colors));

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
    data: [number, ...number[]][],
    startPrice: number,
    height: number
  ): void {
    const resolution = this.renderer.resolution;

    this.horizontalGrid.update(
      timeScale,
      this.renderer.width,
      this.renderer.height - resolution * AXIS_HEIGHT,
      resolution
    );

    this.verticalgrid.update(
      priceScale,
      this.renderer.width - resolution * AXIS_WIDTH,
      this.renderer.height,
      resolution
    );

    for (let i = 0; i < this.series.length; i++) {
      if (i + 1 < data.length) {
        this.series[i].visible = true;
        this.series[i].update(
          priceScale,
          timeScale,
          data.map((d) => [d[0], d[i + 1]]),
          startPrice,
          height,
          resolution
        );
      } else {
        this.series[i].visible = false;
      }
    }
  }
}
