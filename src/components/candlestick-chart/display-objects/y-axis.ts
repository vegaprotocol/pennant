import { ScaleLinear } from "d3-scale";

import { Y_AXIS_WIDTH } from "../../../constants";
import { Container } from "../../../renderer/display";
import { Graphics } from "../../../renderer/graphics";
import { Text } from "../../../renderer/text";
import { FONT_SIZE } from "../candlestick-chart";
import { Rect } from "./rect";

/**
 * Draws vertical grid lines
 */
export class YAxis extends Container {
  /**
   * Cache ticks
   */
  private nodeByKeyValue = new Map<string, Graphics>();
  private rectangle: Rect = new Rect(0x000000, 0.5);

  constructor() {
    super();

    this.rectangle.interactive = true;
    this.rectangle.cursor = "grab";

    this.addChild(this.rectangle);
  }

  public update(
    scale: ScaleLinear<number, number>,
    width: number,
    height: number,
    resolution: number = 1
  ) {
    const numTicks = height / resolution / 50;
    const ticks = scale.ticks(numTicks);
    const tickFormat = scale.tickFormat(numTicks);

    const enter = ticks.filter(
      (tick) => !this.nodeByKeyValue.has(tickFormat(tick))
    );

    const update = ticks.filter((tick) =>
      this.nodeByKeyValue.has(tickFormat(tick))
    );

    const exit = [...this.nodeByKeyValue.keys()].filter(
      (node) => !(ticks.map(tickFormat).indexOf(node) !== -1)
    );

    for (const node of enter) {
      const line = new Graphics();

      line.clear();
      line.lineStyle({
        width: 10,
        color: 0x3d3d3d,
        lineDash: [],
      });
      line.moveTo(-Y_AXIS_WIDTH, 0.5);
      line.lineTo(0, 0.5);
      line.endFill();
      line.x = width;
      line.y = scale(node);

      this.nodeByKeyValue.set(tickFormat(node), line);
      this.addChild(line);
    }

    for (const node of update) {
      const line = this.nodeByKeyValue.get(tickFormat(node))!;

      line.x = width;
      line.y = Math.round(scale(node));
    }

    for (const node of exit) {
      const text = this.nodeByKeyValue.get(node)!;

      this.nodeByKeyValue.delete(node);
      this.removeChild(text);
    }

    this.rectangle.update(width - Y_AXIS_WIDTH, 0, Y_AXIS_WIDTH, height);
  }
}
