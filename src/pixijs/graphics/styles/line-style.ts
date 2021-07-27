import { FillStyle } from "./fill-style";

export class LineStyle extends FillStyle {
  public width = 0;
  public lineDash = [];

  public clone(): LineStyle {
    const obj = new LineStyle();

    obj.alpha = this.alpha;
    obj.color = this.color;
    obj.lineDash = this.lineDash;
    obj.visible = this.visible;
    obj.width = this.width;

    return obj;
  }

  public reset(): void {
    this.color = 0x0;
    this.lineDash = [];
    this.width = 0;
  }
}
