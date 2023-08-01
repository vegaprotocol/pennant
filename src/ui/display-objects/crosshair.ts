import { Container } from "@ui/renderer";

import { HorizontalLine } from "./horizontal-line";
import { VerticalLine } from "./vertical-line";

/**
 * Draw a crosshair
 */
export class Crosshair extends Container {
  private horizontalLine: HorizontalLine;
  private verticalLine: VerticalLine;

  constructor(width = 1, color = 0xffffff, lineDash: number[] = []) {
    super();

    this.horizontalLine = new HorizontalLine(width, color, lineDash);
    this.verticalLine = new VerticalLine(width, color, lineDash);

    this.addChild(this.horizontalLine);
    this.addChild(this.verticalLine);
  }

  public update(
    x: number | null,
    y: number | null,
    width: number,
    height: number,
    resolution: number = 1,
  ) {
    if (x !== null) {
      this.verticalLine.visible = true;
      this.verticalLine.update(x, height, resolution);
    } else {
      this.verticalLine.visible = false;
    }

    if (y !== null) {
      this.horizontalLine.visible = true;
      this.horizontalLine.update(y, width, resolution);
    } else {
      this.horizontalLine.visible = false;
    }
  }
}
