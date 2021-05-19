import { Shape } from "../math";
import { FillStyle, GraphicsData, LineStyle } from ".";
import { Point } from "../display";

export class GraphicsGeometry {
  graphicsData: GraphicsData[] = [];

  /**
   * Draws the given shape to this Graphics object. Can be any of Circle, Rectangle, Ellipse, Line or Polygon.
   *
   * @param shape - The shape object to draw.
   * @param fillStyle - Defines style of the fill.
   * @param lineStyle - Defines style of the lines.
   * @return Returns geometry for chaining.
   */
  public drawShape(
    shape: Shape,
    fillStyle: FillStyle,
    lineStyle: LineStyle
  ): GraphicsGeometry {
    const data = new GraphicsData(shape, fillStyle, lineStyle);

    this.graphicsData.push(data);

    return this;
  }

  public containsPoint(point: Point) {
    const graphicsData = this.graphicsData;

    for (const data of graphicsData) {
      if (!data.fillStyle.visible) {
        continue;
      }

      if (data.shape) {
        if (data.shape.contains(point.x, point.y)) {
          return true;
        }
      }
    }

    return false;
  }
}
