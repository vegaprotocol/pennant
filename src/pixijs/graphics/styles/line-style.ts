import { FillStyle } from "./fill-style";

export class LineStyle extends FillStyle {
  public width = 0;

  public clone(): LineStyle {
    const obj = new LineStyle();

    obj.color = this.color;

    obj.width = this.width;

    return obj;
  }

  public reset(): void {
    this.color = 0xffffff;
    this.width = 0;
  }
}
