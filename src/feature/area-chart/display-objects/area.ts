import { PriceCurve } from "@ui/display-objects";
import { Container, Graphics } from "@ui/renderer";
import { ScaleLinear, ScaleTime } from "@util/types";
import { curveLinear } from "d3-shape";

import { Colors } from "../helpers";

type ContentsColors = Pick<
  Colors,
  | "backgroundSurface"
  | "positiveFill"
  | "positiveStroke"
  | "negativeFill"
  | "negativeStroke"
>;

/**
 * Responsible for drawing area curves for depth chart.
 */
export class Area extends Container {
  public priceCurvePositive: PriceCurve;
  public maskPositive: Graphics;

  public priceCurveNegative: PriceCurve;
  public maskNegative: Graphics;

  public colors: ContentsColors;

  constructor(colors: ContentsColors) {
    super();

    this.colors = colors;

    this.priceCurvePositive = new PriceCurve(
      colors.positiveStroke,
      colors.positiveFill,
      colors.backgroundSurface,
      curveLinear,
    );

    this.maskPositive = new Graphics();
    this.maskPositive.beginFill();
    this.maskPositive.drawRect(0, -1000, 3200, 1000);
    this.maskPositive.endFill();

    this.priceCurveNegative = new PriceCurve(
      colors.negativeStroke,
      colors.negativeFill,
      colors.backgroundSurface,
      curveLinear,
    );

    this.maskNegative = new Graphics();
    this.maskNegative.beginFill(0xffffff);
    this.maskNegative.drawRect(0, 0, 3200, 1000);
    this.maskNegative.endFill();

    this.priceCurvePositive.mask = this.maskPositive;
    this.priceCurveNegative.mask = this.maskNegative;

    this.addChild(this.priceCurveNegative);
    this.priceCurveNegative.addChild(this.maskNegative);

    this.addChild(this.priceCurvePositive);
    this.priceCurvePositive.addChild(this.maskPositive);
  }

  public update(
    priceScale: ScaleLinear,
    timeScale: ScaleTime,
    data: [number, number][],
    startPrice: number,
    height: number,
    resolution = 1,
  ): void {
    this.maskPositive.y = startPrice;
    this.maskNegative.y = startPrice;

    this.priceCurvePositive.update(
      data,
      startPrice,
      resolution,
      this.colors.positiveFill,
      this.colors.positiveStroke,
      this.colors.backgroundSurface,
      false,
      startPrice,
    );

    this.priceCurveNegative.update(
      data,
      height - startPrice,
      resolution,
      this.colors.negativeFill,
      this.colors.negativeStroke,
      this.colors.backgroundSurface,
      true,
      startPrice,
    );
  }
}
