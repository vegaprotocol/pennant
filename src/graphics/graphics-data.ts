import { Shape, Shapes } from "../math";
import { FillStyle, LineStyle } from ".";

/**
 * A class to contain data useful for Graphics objects
 */
export class GraphicsData {
  shape: Shape;
  lineStyle: LineStyle;
  fillStyle: FillStyle;
  type: Shapes;

  constructor(shape: Shape, fillStyle: FillStyle, lineStyle: LineStyle) {
    this.shape = shape;
    this.fillStyle = fillStyle;
    this.lineStyle = lineStyle;
    this.type = shape.type;
  }
}
