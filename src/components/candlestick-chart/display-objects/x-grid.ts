import { ScaleLinear } from "d3-scale";

import { Container } from "../../../renderer/display";
import { Graphics } from "../../../renderer/graphics";
import { Text } from "../../../renderer/text";
import { FONT_SIZE } from "../candlestick-chart";

/**
 * Draws vertical grid lines
 */
export class XGrid extends Container {
  /**
   * Cache ticks
   */
  private nodeByKeyValue = new Map<string, Graphics>();

  constructor() {
    super();
  }

  public update(
    scale: ScaleLinear<number, number>,
    width: number,
    height: number,
    resolution: number = 1
  ) {
    const numTicks = width / resolution / 50;
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
        width: 1,
        color: 0x3d3d3d,
        lineDash: [],
      });
      line.moveTo(0.5, 0);
      line.lineTo(0.5, height);
      line.endFill();
      line.x = scale(node);

      this.nodeByKeyValue.set(tickFormat(node), line);
      this.addChild(line);
    }

    for (const node of update) {
      const line = this.nodeByKeyValue.get(tickFormat(node))!;

      line.clear();
      line.lineStyle({
        width: 1,
        color: 0x3d3d3d,
        lineDash: [],
      });
      line.moveTo(0.5, 0);
      line.lineTo(0.5, height);
      line.endFill();
      line.x = scale(node);

      line.x = Math.round(scale(node));
    }

    for (const node of exit) {
      const text = this.nodeByKeyValue.get(node)!;

      this.nodeByKeyValue.delete(node);
      this.removeChild(text);
    }
  }
}
