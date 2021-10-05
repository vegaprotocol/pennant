import { Texture } from "../..";

export class FillStyle {
  public alpha = 1;
  public color = 0xffffff;
  public texture = Texture.WHITE;
  public visible = false;

  public clone(): FillStyle {
    const obj = new FillStyle();

    obj.alpha = this.alpha;
    obj.color = this.color;
    obj.texture = this.texture;
    obj.visible = this.visible;

    return obj;
  }

  public reset(): void {
    this.alpha = 1;
    this.color = 0xffffff;
    this.texture = Texture.WHITE;
    this.visible = false;
  }
}
