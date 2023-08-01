import { CurveFactory, CurveFactoryLineOnly, curveLinear } from "d3-shape";

import { SHAPES } from "../const";

export class Line {
  public data: [number, number][] = [];
  public curve: CurveFactory | CurveFactoryLineOnly;
  public readonly type: SHAPES.LINE;

  constructor(
    data: [number, number][] = [],
    curve: CurveFactory | CurveFactoryLineOnly = curveLinear,
  ) {
    this.data = data;
    this.curve = curve;
    this.type = SHAPES.LINE;
  }

  clone(): Line {
    return new Line(this.data, this.curve);
  }

  copyFrom(line: Line): Line {
    this.data = line.data;
    this.curve = line.curve;

    return this;
  }

  copyTo(line: Line): Line {
    line.data = this.data;
    line.curve = this.curve;

    return line;
  }

  contains(x: number, y: number): boolean {
    // TODO: Is there an easy way to do this?

    return false;
  }
}
