import { ScaleLinear, ScaleTime } from "../types";
import { YAxisElement, YAxisTooltipElement } from "../elements";
import { Colors } from "../helpers";

/**
 * The y-axis component renders human readable reference marks.
 */
export class YAxis {
  private axis: YAxisElement = new YAxisElement();
  private ctx: CanvasRenderingContext2D | null = null;
  private _pixelRatio: number = 1;
  private position: number | null = null;
  private tooltip: YAxisTooltipElement = new YAxisTooltipElement(5); // FIXME: Use correct formatting
  private _xScale: ScaleTime;
  private _yScale: ScaleLinear;

  constructor(x: ScaleTime, y: ScaleLinear) {
    this._xScale = x.copy();
    this._yScale = y.copy();
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
      this.tooltip.draw(
        this.ctx,
        this._xScale,
        this._yScale,
        this._pixelRatio,
        this.position
      );
    }
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
