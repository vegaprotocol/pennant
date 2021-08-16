import { BaseTexture } from "../base-texture";

// TODO: Might not be needed with only canvas and not WebGL
export abstract class Resource {
  protected _width: number;
  protected _height: number;

  constructor(width = 0, height = 0) {
    this._width = width;
    this._height = height;
  }

  bind(baseTexture: BaseTexture): void {}

  unbind(baseTexture: BaseTexture): void {}

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }
}
