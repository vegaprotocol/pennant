import { Renderer, Texture } from "../core";
import { Container } from "../display";
import { Point } from "../math";
import { settings } from "../settings";

export class Sprite extends Container {
  _height: number;
  _texture: Texture = Texture.EMPTY;
  _width: number;

  protected _anchor: Point;

  private _roundPixels: boolean;

  constructor(texture?: Texture) {
    super();

    this._anchor = new Point(
      texture ? texture.defaultAnchor.x : 0,
      texture ? texture.defaultAnchor.y : 0
    );

    this._height = 0;
    this._width = 0;

    this.texture = texture ?? Texture.EMPTY;

    this._roundPixels = settings.ROUND_PIXELS;
  }

  protected _render(renderer: Renderer): void {
    renderer.plugins.sprite.render(this);
  }

  get anchor(): Point {
    return this._anchor;
  }

  set anchor(value: Point) {
    this._anchor.copyFrom(value);
  }

  set roundPixels(value: boolean) {
    this._roundPixels = value;
  }

  get roundPixels(): boolean {
    return this._roundPixels;
  }

  get texture(): Texture {
    return this._texture;
  }

  set texture(value: Texture) {
    if (this._texture === value) {
      return;
    }

    this._texture = value ?? Texture.EMPTY;
  }
}
