import { CurveFactory, CurveFactoryLineOnly, curveLinear } from "d3-shape";

import { Renderer } from "../core";
import { Container } from "../display";
import {
  Area,
  Circle,
  Line,
  Matrix,
  Point,
  PointData,
  Polygon,
  Rectangle,
  Shape,
} from "../math";
import { GraphicsGeometry } from "./graphics-geometry";
import { FillStyle } from "./styles/fill-style";
import { LineStyle } from "./styles/line-style";

export interface FillStyleOptions {
  alpha?: number;
  color?: number;
}

export interface LineStyleOptions extends FillStyleOptions {
  lineDash?: number[];
  width?: number;
}

export class Graphics extends Container {
  protected _fillStyle: FillStyle;
  protected _lineStyle: LineStyle;
  protected _matrix: Matrix | null;
  protected _tint: number;
  public currentPath: Polygon | null = null;

  private _geometry: GraphicsGeometry;

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
    this.finishPoly();

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

    const visible = (options?.alpha ?? 1) > 0;

    Object.assign(this._fillStyle, { visible }, options);

    return this;
  }

  public lineStyle(options: LineStyleOptions | null = null): this {
    return this.lineTextureStyle(options ?? {});
  }

  public lineTextureStyle(options: LineStyleOptions): this {
    // Apply defaults
    options = Object.assign(
      {
        alpha: 1,
        width: 0,
        color: 0x0,
        lineDash: [],
      },
      options
    );

    const visible = (options?.width ?? 0 > 0) && (options?.alpha ?? 0 > 0);

    Object.assign(this._lineStyle, { visible }, options);

    return this;
  }

  public drawArea(
    data: [number, number][],
    curve: CurveFactory = curveLinear,
    y0: number = 0
  ): this {
    return this.drawShape(new Area(data, curve, y0));
  }

  public drawCircle(x: number, y: number, radius: number): this {
    return this.drawShape(new Circle(x, y, radius));
  }

  public drawLine(
    data: [number, number][],
    curve: CurveFactory | CurveFactoryLineOnly = curveLinear
  ): this {
    return this.drawShape(new Line(data, curve));
  }

  public drawRect(x: number, y: number, width: number, height: number): this {
    return this.drawShape(new Rectangle(x, y, width, height));
  }

  public moveTo(x: number, y: number): this {
    this.startPoly();
    this.currentPath!.points[0] = x;
    this.currentPath!.points[1] = y;

    return this;
  }

  public lineTo(x: number, y: number): this {
    if (!this.currentPath) {
      this.moveTo(0, 0);
    }

    const points = this.currentPath!.points;

    points.push(x, y);

    return this;
  }

  public closePath(): this {
    const currentPath = this.currentPath;

    if (currentPath) {
      currentPath.closeStroke = true;
    }

    return this;
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

  protected startPoly(): void {
    if (this.currentPath) {
      const points = this.currentPath.points;
      const len = this.currentPath.points.length;

      if (len > 2) {
        this.drawShape(this.currentPath);
        this.currentPath = new Polygon();
        this.currentPath.closeStroke = false;
        this.currentPath.points.push(points[len - 2], points[len - 1]);
      }
    } else {
      this.currentPath = new Polygon();
      this.currentPath.closeStroke = false;
    }
  }

  finishPoly(): void {
    if (this.currentPath) {
      if (this.currentPath.points.length > 2) {
        this.drawShape(this.currentPath);
        this.currentPath = null;
      } else {
        this.currentPath.points.length = 0;
      }
    }
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
