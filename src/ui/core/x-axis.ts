import { XAxisElement, XAxisTooltipElement } from "@ui/elements";
import { clearCanvas } from "@util/misc";
import { Interval, ScaleTime } from "@util/types";

import { Colors } from "../../feature/candlestick-chart/helpers";

/**
 * The x-axis component renders human readable reference marks.
 */
export class XAxis {
  public colors: Colors;

  private axis: XAxisElement = new XAxisElement();
  private ctx: CanvasRenderingContext2D | null = null;
  private _interval: Interval;
  private _pixelRatio: number = 1;
  private position: Date | null = null;
  private tooltip: XAxisTooltipElement = new XAxisTooltipElement();
  private _xScale: ScaleTime;

  constructor(x: ScaleTime, interval: Interval, colors: Colors) {
    this._interval = interval;
    this._xScale = x.copy();
    this.colors = colors;
  }

  context(context: CanvasRenderingContext2D): this {
    this.ctx = context;
    return this;
  }

  crosshair(pos: Date | null): this {
    this.position = pos;
    return this;
  }

  draw() {
    if (this.ctx) {
      clearCanvas(this.ctx.canvas, this.ctx, this.colors.backgroundSurface);

      this.axis.draw(
        this.ctx,
        this._xScale,
        null!,
        this._pixelRatio,
        this._interval,
        this.colors.textSecondary,
      );

      this.tooltip.draw(
        this.ctx,
        this._xScale,
        null!,
        this._pixelRatio,
        this.position,
        this._interval,
        this.colors,
      );
    }
  }

  interval(interval: Interval) {
    this._interval = interval;
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
}
