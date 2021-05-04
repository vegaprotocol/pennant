import { Colors, clearCanvas } from "../helpers";
import { XAxisElement, XAxisTooltipElement } from "../elements";

import { ScaleTime } from "../types";

/**
 * The x-axis component renders human readable reference marks.
 */
export class XAxis {
  private axis: XAxisElement = new XAxisElement();
  private ctx: CanvasRenderingContext2D | null = null;
  private _pixelRatio: number = 1;
  private position: Date | null = null;
  private tooltip: XAxisTooltipElement = new XAxisTooltipElement();
  private _xScale: ScaleTime;

  constructor(x: ScaleTime) {
    this._xScale = x.copy();
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
      clearCanvas(this.ctx.canvas, this.ctx, Colors.BACKGROUND);
      this.axis.draw(this.ctx, this._xScale, null!, this._pixelRatio);
      this.tooltip.draw(
        this.ctx,
        this._xScale,
        null!,
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
}
