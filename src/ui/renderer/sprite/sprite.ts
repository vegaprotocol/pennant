import { Renderer, Texture } from "../core";
import { Container } from "../display";
import { Point } from "../math";
import { settings } from "../settings";
import { sign } from "../utils";

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
      texture ? texture.defaultAnchor.y : 0,
    );

    this._height = 0;
    this._width = 0;

    this.texture = texture ?? Texture.EMPTY;

    this._roundPixels = settings.ROUND_PIXELS;
  }

  protected _render(renderer: Renderer): void {
    renderer.plugins.sprite.render(this);
  }

  get width(): number {
    return Math.abs(this.scale.x) * this._texture.orig.width;
  }

  set width(value: number) {
    const s = sign(this.scale.x) || 1;

    this.scale.x = (s * value) / this._texture.orig.width;
    this._width = value;
  }

  /**
   * The height of the sprite, setting this will actually modify the scale to achieve the value set
   *
   * @member {number}
   */
  get height(): number {
    return Math.abs(this.scale.y) * this._texture.orig.height;
  }

  set height(value: number) {
    const s = sign(this.scale.y) || 1;

    this.scale.y = (s * value) / this._texture.orig.height;
    this._height = value;
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
