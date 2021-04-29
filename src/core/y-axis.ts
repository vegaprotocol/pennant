import { ScaleLinear, ScaleTime } from "../types";
import { YAxisElement, YAxisTooltipElement } from "../elements";
import { Colors } from "../helpers";

/**
 * The y-axis component renders human readable reference marks.
 */
export class YAxis {
  private axis: YAxisElement = new YAxisElement();
  private ctx: CanvasRenderingContext2D | null = null;
  private latestPricePosition: number | null = null;
  private _pixelRatio: number = 1;
  private position: number | null = null;
  private tooltip: YAxisTooltipElement;
  private latestPriceTooltip: YAxisTooltipElement;
  private _xScale: ScaleTime;
  private _yScale: ScaleLinear;

  constructor(x: ScaleTime, y: ScaleLinear, decimalPlaces: number = 5) {
    this._xScale = x.copy();
    this._yScale = y.copy();
    this.tooltip = new YAxisTooltipElement(decimalPlaces);
    this.latestPriceTooltip = new YAxisTooltipElement(decimalPlaces);
  }

  context(context: CanvasRenderingContext2D): this {
    this.ctx = context;
    return this;
  }

  crosshair(pos: number | null): this {
    this.position = pos;
    return this;
  }

  draw() {
    if (this.ctx) {
      this.axis.draw(this.ctx, this._xScale, this._yScale, this._pixelRatio);

      this.latestPriceTooltip.draw(
        this.ctx,
        this._xScale,
        this._yScale,
        this._pixelRatio,
        this.latestPricePosition
      );

      this.tooltip.draw(
        this.ctx,
        this._xScale,
        this._yScale,
        this._pixelRatio,
        this.position
      );
    }
  }

  latestPrice(price: number | null): this {
    this.latestPricePosition = price;
    return this;
  }

  pixelRatio(ratio: number): this {
    this._pixelRatio = ratio;
    return this;
  }

  xScale(x: ScaleTime): this {
    this._xScale = x.copy();
    return this;
  }

  yScale(y: ScaleLinear): this {
    this._yScale = y.copy();
    return this;
  }
}
