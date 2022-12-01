import { curveLinear } from "d3-shape";

import { Renderer } from "../../renderer";
import { Container } from "../../renderer/display";
import { Graphics } from "../../renderer/graphics";
import { ScaleLinear, ScaleTime } from "../../types";
import { AXIS_HEIGHT } from "../depth-chart";
import { Colors } from "../depth-chart/helpers";
import { AXIS_WIDTH } from "./chart";
import { HorizontalGrid, PriceCurve, VerticalGrid } from "./display-objects";

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

  public priceCurvePositive: PriceCurve;
  public maskPositive: Graphics;

  public priceCurveNegative: PriceCurve;
  public maskNegative: Graphics;

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

    this.priceCurvePositive = new PriceCurve(
      options.colors.buyStroke,
      options.colors.buyFill,
      options.colors.backgroundSurface,
      curveLinear
    );

    this.maskPositive = new Graphics();
    this.maskPositive.beginFill();
    this.maskPositive.drawRect(0, -1000, 3200, 1000);
    this.maskPositive.endFill();

    this.priceCurveNegative = new PriceCurve(
      options.colors.sellStroke,
      options.colors.sellFill,
      options.colors.backgroundSurface,
      curveLinear
    );

    this.maskNegative = new Graphics();
    this.maskNegative.beginFill(0xffffff);
    this.maskNegative.drawRect(0, 0, 3200, 1000);
    this.maskNegative.endFill();

    this.priceCurvePositive.mask = this.maskPositive;
    this.priceCurveNegative.mask = this.maskNegative;

    this.stage.addChild(this.horizontalGrid);
    this.stage.addChild(this.verticalgrid);

    this.stage.addChild(this.priceCurveNegative);
    this.priceCurveNegative.addChild(this.maskNegative);

    this.stage.addChild(this.priceCurvePositive);
    this.priceCurvePositive.addChild(this.maskPositive);
  }

  public render(): void {
    this.renderer.render(this.stage);
  }

  public update(
    priceScale: ScaleLinear,
    timeScale: ScaleTime,
    data: [number, number][],
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

    this.maskPositive.y = startPrice;
    this.maskNegative.y = startPrice;

    this.priceCurvePositive.update(
      data,
      startPrice,
      resolution,
      this.colors.buyFill,
      this.colors.buyStroke,
      this.colors.backgroundSurface,
      false,
      startPrice
    );

    this.priceCurveNegative.update(
      data,
      height - startPrice,
      resolution,
      this.colors.sellFill,
      this.colors.sellStroke,
      this.colors.backgroundSurface,
      true,
      startPrice
    );
  }
}
