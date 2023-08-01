import { CurveFactory, CurveFactoryLineOnly, curveLinear } from "d3-shape";

import { Renderer, Texture } from "../core";
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
  texture?: Texture;
  matrix?: Matrix;
}

export interface LineStyleOptions extends FillStyleOptions {
  lineDash?: number[];
  width?: number;
}

/**
 * The Graphics class is primarily used to render primitive shapes such as lines, circles and
 * rectangles to the display, and to color and fill them.
 */
export class Graphics extends Container {
  public currentPath: Polygon | null = null;

  /** Current fill style. */
  protected _fillStyle: FillStyle;

  /** Current line style. */
  protected _lineStyle: LineStyle;

  /** Current shape matrix. */
  protected _matrix: Matrix | null;

  protected _tint: number;
  private _geometry: GraphicsGeometry;

  constructor(geometry: GraphicsGeometry | null = null) {
    super();

    this._geometry = geometry || new GraphicsGeometry();
    this._fillStyle = new FillStyle();
    this._lineStyle = new LineStyle();
    this._matrix = null;

    this._tint = 0xffffff;
  }

  /**
   * Draw any shape.
   */
  public drawShape(shape: Shape): this {
    this._geometry.drawShape(
      shape,
      this._fillStyle.clone(),
      this._lineStyle.clone(),
      this._matrix,
    );

    return this;
  }

  /**
   * Specifies a simple one-color fill that subsequent calls to other Graphics methods
   * (such as lineTo() or drawCircle()) use when drawing.
   */
  public beginFill(color = 0, alpha = 1): this {
    return this.beginTextureFill({ color, alpha });
  }

  /**
   * Applies a fill to the lines and shapes that were added since the last call to the beginFill() method.
   */
  public endFill(): this {
    this.finishPoly();

    this._fillStyle.reset();

    return this;
  }

  /**
   * Begin the texture fill
   */
  public beginTextureFill(options?: FillStyleOptions): this {
    options = Object.assign(
      {
        texture: Texture.WHITE,
        alpha: 1,
        color: 0xffffff,
        matrix: null,
      },
      options,
    ) as FillStyleOptions;

    const visible = (options?.alpha ?? 1) > 0;

    if (visible) {
      if (options.matrix) {
        options.matrix = options.matrix.clone();
        options.matrix.invert();
      }
    }

    Object.assign(this._fillStyle, { visible }, options);

    return this;
  }

  /**
   * Specifies the line style used for subsequent calls to Graphics methods such as the lineTo()
   * method or the drawCircle() method.
   */
  public lineStyle(options: LineStyleOptions | null = null): this {
    return this.lineTextureStyle(options ?? {});
  }

  /**
   * Like line style but support texture for line fill.
   */
  public lineTextureStyle(options: LineStyleOptions): this {
    // Apply defaults
    options = Object.assign(
      {
        alpha: 1,
        width: 0,
        color: 0x0,
        lineDash: [],
      },
      options,
    );

    const visible = (options?.width ?? 0 > 0) && (options?.alpha ?? 0 > 0);

    Object.assign(this._lineStyle, { visible }, options);

    return this;
  }

  /**
   * Draws an area, as in an area chart.
   * An area is defined by two bounding lines.
   */
  public drawArea(
    data: [number, number, number][],
    curve: CurveFactory = curveLinear,
  ): this {
    return this.drawShape(new Area(data, curve));
  }

  /**
   * Draws a circle.
   */
  public drawCircle(x: number, y: number, radius: number): this {
    return this.drawShape(new Circle(x, y, radius));
  }

  /**
   * Draws a line, as in a line chart.
   */
  public drawLine(
    data: [number, number][],
    curve: CurveFactory | CurveFactoryLineOnly = curveLinear,
  ): this {
    return this.drawShape(new Line(data, curve));
  }

  /**
   * Draws a rectangle shape.
   */
  public drawRect(x: number, y: number, width: number, height: number): this {
    return this.drawShape(new Rectangle(x, y, width, height));
  }

  /**
   * Moves the current drawing position to x, y.
   */
  public moveTo(x: number, y: number): this {
    this.startPoly();
    this.currentPath!.points[0] = x;
    this.currentPath!.points[1] = y;

    return this;
  }

  /**
   * Draws a line using the current line style from the current drawing position to (x, y);
   * The current drawing position is then set to (x, y).
   */
  public lineTo(x: number, y: number): this {
    if (!this.currentPath) {
      this.moveTo(0, 0);
    }

    const points = this.currentPath!.points;

    points.push(x, y);

    return this;
  }

  /**
   * Closes the current path.
   */
  public closePath(): this {
    const currentPath = this.currentPath;

    if (currentPath) {
      currentPath.closeStroke = true;
    }

    return this;
  }

  /**
   * Clears the graphics that were drawn to this Graphics object, and resets fill and line style settings.
   */
  public clear(): this {
    this._geometry.clear();
    this._lineStyle.reset();
    this._fillStyle.reset();

    return this;
  }

  /**
   * Tests if a point is inside this graphics object.
   */
  public containsPoint(point: PointData): boolean {
    this.worldTransform.applyInverse(point, Graphics._TEMP_POINT);

    return this._geometry.containsPoint(Graphics._TEMP_POINT);
  }

  protected _render(renderer: Renderer): void {
    if (this.isMask === true) {
      return;
    }

    renderer.plugins.graphics.render(this);
  }

  /**
   * Start a polygon object internally.
   */
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

  /**
   * Finish the polygon object.
   */
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

  /**
   * Temporary point to use for containsPoint
   */
  static _TEMP_POINT = new Point();
}
