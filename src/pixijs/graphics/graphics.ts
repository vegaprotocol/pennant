import { CurveFactory, CurveFactoryLineOnly, curveLinear } from "d3-shape";

import { Renderer } from "../core";
import { Container } from "../display";
import { Line, Matrix, Point, PointData, Rectangle, Shape } from "../math";
import { GraphicsGeometry } from "./graphics-geometry";
import { FillStyle } from "./styles/fill-style";
import { LineStyle } from "./styles/line-style";

export interface FillStyleOptions {
  alpha?: number;
  color?: number;
}

export interface LineStyleOptions extends FillStyleOptions {
  width?: number;
}

export class Graphics extends Container {
  private _geometry: GraphicsGeometry;
  protected _fillStyle: FillStyle;
  protected _lineStyle: LineStyle;
  protected _matrix: Matrix | null;
  protected _tint: number;

  constructor(geometry: GraphicsGeometry | null = null) {
    super();

    this._geometry = geometry || new GraphicsGeometry();
    this._fillStyle = new FillStyle();
    this._lineStyle = new LineStyle();
    this._matrix = null;

    this._tint = 0xffffff;
  }

  public drawShape(shape: Shape): this {
    this._geometry.drawShape(
      shape,
      this._fillStyle.clone(),
      this._lineStyle.clone(),
      this._matrix
    );

    return this;
  }

  public beginFill(color = 0, alpha = 1): this {
    return this.beginTextureFill({ color, alpha });
  }

  public endFill(): this {
    this._fillStyle.reset();

    return this;
  }

  public beginTextureFill(options?: FillStyleOptions): this {
    // Apply defaults
    options = Object.assign(
      {
        alpha: 1,
        color: 0xffffff,
      },
      options
    ) as FillStyleOptions;

    Object.assign(this._fillStyle, options);

    return this;
  }

  public lineStyle(options: LineStyleOptions | null = null): this {
    return this.lineTextureStyle(options ?? {});
  }

  public lineTextureStyle(options: LineStyleOptions): this {
    // Apply defaults
    options = Object.assign(
      {
        width: 0,
        color: 0x0,
      },
      options
    );

    Object.assign(this._lineStyle, options);

    return this;
  }

  public drawRect(x: number, y: number, width: number, height: number): this {
    return this.drawShape(new Rectangle(x, y, width, height));
  }

  public drawLine(
    data: [number, number][],
    curve: CurveFactory | CurveFactoryLineOnly = curveLinear
  ): this {
    return this.drawShape(new Line(data, curve));
  }

  public clear(): this {
    this._geometry.clear();
    this._lineStyle.reset();
    this._fillStyle.reset();

    return this;
  }

  public containsPoint(point: PointData): boolean {
    this.worldTransform.applyInverse(point, Graphics._TEMP_POINT);

    return this._geometry.containsPoint(Graphics._TEMP_POINT);
  }

  protected _render(renderer: Renderer): void {
    renderer.plugins.graphics.render(this);
  }

  public get geometry(): GraphicsGeometry {
    return this._geometry;
  }

  public get tint(): number {
    return this._tint;
  }

  public set tint(value: number) {
    this._tint = value;
  }

  static _TEMP_POINT = new Point();
}
