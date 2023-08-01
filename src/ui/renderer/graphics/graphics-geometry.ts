import { BatchGeometry } from "../core";
import { Bounds } from "../display/bounds";
import { Matrix, Point, PointData, Shape } from "../math";
import { GraphicsData } from "./graphics-data";
import { FillStyle } from "./styles/fill-style";
import { LineStyle } from "./styles/line-style";

const tmpPoint = new Point();
const tmpBounds = new Bounds();

/**
 * The Graphics class contains methods used to draw primitive shapes such as lines, circles and
 * rectangles to the display, and to color and fill them.
 */
export class GraphicsGeometry extends BatchGeometry {
  /** The collection of drawn shapes. */
  public graphicsData: Array<GraphicsData>;

  /** An array of points to draw, 2 numbers per point */
  public points: Array<number>;

  constructor() {
    super();

    this.graphicsData = [];
    this.points = [];
  }

  /**
   * Clears the graphics that were drawn to this Graphics object, and resets fill and line style settings.
   */
  public clear(): GraphicsGeometry {
    if (this.graphicsData.length > 0) {
      this.graphicsData.length = 0;
    }

    return this;
  }

  /**
   * Draws the given shape to this Graphics object.
   */
  public drawShape(
    shape: Shape,
    fillStyle: FillStyle | null = null,
    lineStyle: LineStyle | null = null,
    matrix: Matrix | null = null,
  ): GraphicsGeometry {
    const data = new GraphicsData(shape, fillStyle, lineStyle, matrix);

    this.graphicsData.push(data);

    return this;
  }

  /**
   * Check to see if a point is contained within this geometry.
   */
  public containsPoint(point: PointData): boolean {
    const graphicsData = this.graphicsData;

    for (let i = 0; i < graphicsData.length; ++i) {
      const data = graphicsData[i];

      if (data.shape) {
        if (data.matrix) {
          data.matrix.applyInverse(point, tmpPoint);
        } else {
          tmpPoint.copyFrom(point);
        }

        if (data.shape.contains(tmpPoint.x, tmpPoint.y)) {
          return true;
        }
      }
    }

    return false;
  }
}
