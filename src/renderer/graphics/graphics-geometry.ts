import { BatchGeometry } from "../core";
import { Bounds } from "../display/bounds";
import { Matrix, Point, PointData, Shape } from "../math";
import { GraphicsData } from "./graphics-data";
import { FillStyle } from "./styles/fill-style";
import { LineStyle } from "./styles/line-style";

const tmpPoint = new Point();
const tmpBounds = new Bounds();

export class GraphicsGeometry extends BatchGeometry {
  public graphicsData: Array<GraphicsData>;
  public points: Array<number>;

  constructor() {
    super();

    this.graphicsData = [];
    this.points = [];
  }

  public clear(): GraphicsGeometry {
    if (this.graphicsData.length > 0) {
      this.graphicsData.length = 0;
    }

    return this;
  }

  public drawShape(
    shape: Shape,
    fillStyle: FillStyle | null = null,
    lineStyle: LineStyle | null = null,
    matrix: Matrix | null = null
  ): GraphicsGeometry {
    const data = new GraphicsData(shape, fillStyle, lineStyle, matrix);

    this.graphicsData.push(data);

    return this;
  }

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
