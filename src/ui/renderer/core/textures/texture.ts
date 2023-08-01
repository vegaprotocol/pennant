import { Point, PointData, Rectangle } from "../../math";
import { BaseTexture, BaseTextureOptions, ImageSource } from "./base-texture";
import { Resource } from "./resources/resource";

export type TextureSource = string | BaseTexture | ImageSource;

// TODO: Simplify orig and _frame into one value?

/**
 * A texture stores the information that represents an image or part of an image.
 */
export class Texture<R extends Resource = Resource> {
  /** The base texture that this texture uses. */
  public baseTexture: BaseTexture;

  /** This is the area of original texture. */
  public orig: Rectangle;

  /** This is the area of the BaseTexture image to actually copy to the canvas when rendering, */
  public _frame: Rectangle;

  public defaultAnchor: Point;

  constructor(
    baseTexture: BaseTexture<R>,
    frame: Rectangle = new Rectangle(0, 0, 1, 1),
    orig: Rectangle = frame,
    anchor?: PointData,
  ) {
    this.baseTexture = baseTexture;

    this._frame = frame;
    this.orig = orig;

    this.defaultAnchor = anchor
      ? new Point(anchor.x, anchor.y)
      : new Point(0, 0);
  }

  onBaseTextureUpdated(baseTexture: BaseTexture): void {
    this._frame.width = baseTexture.width;
    this._frame.height = baseTexture.height;
  }

  get frame(): Rectangle {
    return this._frame;
  }

  set frame(frame: Rectangle) {
    this._frame = frame;

    const { x, y, width, height } = frame;
    const xNotFit = x + width > this.baseTexture.width;
    const yNotFit = y + height > this.baseTexture.height;

    if (xNotFit || yNotFit) {
      const relationship = xNotFit && yNotFit ? "and" : "or";
      const errorX = `X: ${x} + ${width} = ${x + width} > ${
        this.baseTexture.width
      }`;
      const errorY = `Y: ${y} + ${height} = ${y + height} > ${
        this.baseTexture.height
      }`;

      throw new Error(
        "Texture Error: frame does not fit inside the base Texture dimensions: " +
          `${errorX} ${relationship} ${errorY}`,
      );
    }

    this.orig = frame;
  }

  /**
   * Returns resolution of baseTexture
   */
  get resolution(): number {
    return this.baseTexture.resolution;
  }

  static from<R extends Resource = Resource>(
    source: TextureSource,
    options: Partial<BaseTextureOptions> = {},
  ): Texture<R> {
    const texture = new Texture<R>(new BaseTexture<R>(source, options));

    return texture;
  }

  static readonly EMPTY: Texture = new Texture(new BaseTexture());
  static readonly WHITE: Texture = new Texture(new BaseTexture());
}
