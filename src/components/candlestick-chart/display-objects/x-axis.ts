import { ScaleTime } from "d3-scale";

import { Container } from "../../../renderer/display";
import { Graphics } from "../../../renderer/graphics";
import { Text } from "../../../renderer/text";
import { FONT_SIZE } from "../../depth-chart";
import { HorizontalLine } from ".";
import { Rect } from "./rect";

/**
 * Draws vertical grid lines
 */
export class HorizontalAxis extends Container {
  /**
   * Cache ticks
   */
  private nodeByKeyValue = new Map<string, Text>();
  private rectangle: Rect = new Rect(0x000000, 0.5);
  private border: HorizontalLine = new HorizontalLine(1, 0xaaaaaa);
  private tooltip: Graphics = new Graphics();

  constructor() {
    super();

    this.rectangle.interactive = true;
    this.rectangle.cursor = "ew-resize";
    this.addChild(this.rectangle);
    this.addChild(this.border);
    this.addChild(this.tooltip);
  }

  public update(
    scale: ScaleTime<number, number>,
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
      const text = new Text(tickFormat(node), {
        fill: 0xffffff,
        fontFamily: "monospace",
        fontSize: FONT_SIZE,
      });

      text.x = scale(node);
      text.y = 10;
      text.anchor.set(0, 0.5);

      text.updateText(); // TODO: Should not need to call this

      this.nodeByKeyValue.set(tickFormat(node), text);
      this.addChild(text);
    }

    for (const node of update) {
      const text = this.nodeByKeyValue.get(tickFormat(node))!;

      text.x = scale(node);
      text.y = 10;
    }

    for (const node of exit) {
      const text = this.nodeByKeyValue.get(node)!;

      this.nodeByKeyValue.delete(node);
      this.removeChild(text);
    }

    this.rectangle.update(0, 0, width, height);
    this.border.update(0, width);
  }
}
