export class FillStyle {
  public alpha = 1;
  public color = 0xffffff;

  public clone(): FillStyle {
    const obj = new FillStyle();

    obj.alpha = this.alpha;
    obj.color = this.color;

    return obj;
  }

  public reset(): void {
    this.alpha = 1;
    this.color = 0xffffff;
  }
}
