import { Container, Text } from "@ui/renderer";
import { ScaleLinear } from "d3-scale";

import { FONT_SIZE } from "../depth-chart";
import { Colors } from "../helpers";

type VerticalAxisColors = Pick<
  Colors,
  "backgroundSurface" | "textPrimary" | "textSecondary"
>;

/**
 * Draws a vertical axis at the right of the chart
 */
export class VerticalAxis extends Container {
  /**
   * Cache ticks
   */
  private nodeByKeyValue = new Map<string, Text>();

  constructor() {
    super();
  }

  public update(
    scale: ScaleLinear<number, number>,
    width: number,
    height: number,
    resolution: number = 1,
    colors: VerticalAxisColors,
  ) {
    const numTicks = height / resolution / 50;
    const ticks = scale.ticks(numTicks).filter((tick) => tick !== 0);
    const tickFormat = scale.tickFormat(numTicks);

    const enter = ticks.filter(
      (tick) => !this.nodeByKeyValue.has(tickFormat(tick)),
    );

    const update = ticks.filter((tick) =>
      this.nodeByKeyValue.has(tickFormat(tick)),
    );

    const exit = [...this.nodeByKeyValue.keys()].filter(
      (node) => !(ticks.map(tickFormat).indexOf(node) !== -1),
    );

    for (const node of enter) {
      const text = new Text(tickFormat(node), {
        fill: colors.textSecondary,
        fontFamily: "monospace",
        fontSize: FONT_SIZE,
      });

      text.x = width - resolution * 7;
      text.y = scale(node);
      text.anchor.set(1, 0.5);

      text.updateText(); // TODO: Should not need to call this

      this.nodeByKeyValue.set(tickFormat(node), text);
      this.addChild(text);
    }

    for (const node of update) {
      const text = this.nodeByKeyValue.get(tickFormat(node))!;

      text.style.fill = colors.textSecondary;
      text.x = width - resolution * 7;
      text.y = scale(node);
    }

    for (const node of exit) {
      const text = this.nodeByKeyValue.get(node)!;

      this.nodeByKeyValue.delete(node);
      this.removeChild(text);
    }
  }
}
