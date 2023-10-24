import { Area, HorizontalGrid, VerticalGrid } from "@ui/display-objects";
import { Container, Renderer } from "@ui/renderer";
import { AXIS_HEIGHT, AXIS_WIDTH } from "@util/constants";
import { ScaleLinear, ScaleTime } from "@util/types";

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
  public priceCurve: Area;
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
    this.priceCurve = new Area(options.colors);

    this.stage.addChild(this.horizontalGrid);
    this.stage.addChild(this.verticalgrid);
    this.stage.addChild(this.priceCurve);
  }

  public render(): void {
    this.renderer.render(this.stage);
  }

  public update(
    priceScale: ScaleLinear,
    timeScale: ScaleTime,
    data: ReadonlyArray<[number, number]>,
    startPrice: number,
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

    this.priceCurve.visible = true;
    this.priceCurve.colors = this.colors;

    this.priceCurve.update(
      priceScale,
      timeScale,
      data.map((d) => [d[0], d[1]]),
      startPrice,
      height,
      resolution,
    );
  }
}
