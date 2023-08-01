import { CurveFactory, curveLinear } from "d3-shape";

import { SHAPES } from "../const";

export class Area {
  public data: [number, number, number][] = [];
  public curve: CurveFactory;
  public y0: number = 0;
  public readonly type: SHAPES.AREA;

  constructor(
    data: [number, number, number][] = [],
    curve: CurveFactory = curveLinear,
    y0: number = 0,
  ) {
    this.data = data;
    this.curve = curve;
    this.y0 = y0;
    this.type = SHAPES.AREA;
  }

  clone(): Area {
    return new Area(this.data, this.curve, this.y0);
  }

  copyFrom(area: Area): Area {
    this.data = area.data;
    this.curve = area.curve;
    this.y0 = area.y0;

    return this;
  }

  copyTo(area: Area): Area {
    area.data = this.data;
    area.curve = this.curve;
    area.y0 = this.y0;

    return area;
  }

  contains(x: number, y: number): boolean {
    // TODO: Is there an easy way to do this?

    return false;
  }
}
