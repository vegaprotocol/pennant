import { Matrix, Shape, SHAPES } from "../math";
import { FillStyle } from "./styles/fill-style";
import { LineStyle } from "./styles/line-style";

/**
 * A class to contain data useful for Graphics objects.
 */
export class GraphicsData {
  public shape: Shape;
  public lineStyle: LineStyle | null;
  public fillStyle: FillStyle | null;
  public matrix: Matrix | null;
  public type: SHAPES;

  constructor(
    shape: Shape,
    fillStyle: FillStyle | null = null,
    lineStyle: LineStyle | null = null,
    matrix: Matrix | null = null,
  ) {
    this.shape = shape;
    this.lineStyle = lineStyle;
    this.fillStyle = fillStyle;
    this.matrix = matrix;
    this.type = shape.type;
  }
}
