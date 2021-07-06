import { Texture } from "../core";
import { Container } from "../display";
import { Point } from "../math";

export class Sprite extends Container {
  _height: number;
  _texture: Texture = Texture.EMPTY;
  _width: number;

  protected _anchor: Point;

  constructor(texture?: Texture) {
    super();

    this._anchor = new Point(
      texture ? texture.defaultAnchor.x : 0,
      texture ? texture.defaultAnchor.y : 0
    );

    this._height = 0;
    this._width = 0;

    this.texture = texture ?? Texture.EMPTY;
  }

  get anchor(): Point {
    return this._anchor;
  }

  set anchor(value: Point) {
    this._anchor.copyFrom(value);
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
