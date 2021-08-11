import { ScaleLinear } from "d3-scale";

import { Container } from "../../../renderer/display";
import { Text } from "../../../renderer/text";
import { AXIS_HEIGHT } from "..";

function format(value: number): string {
  return String(value);
}

export class HorizontalAxis extends Container {
  private nodeByKeyValue = new Map<string, Text>();

  constructor() {
    super();
  }

  public update(
    scale: ScaleLinear<number, number>,
    width: number,
    height: number
  ) {
    const ticks = scale.ticks(width / 100);

    const enter = ticks.filter(
      (tick) => !this.nodeByKeyValue.has(format(tick))
    );

    const update = ticks.filter((tick) =>
      this.nodeByKeyValue.has(format(tick))
    );

    const exit = [...this.nodeByKeyValue.keys()].filter(
      (node) => !(ticks.map(format).indexOf(node) !== -1)
    );

    for (const node of enter) {
      const text = new Text(format(node), {
        fill: 0xa1a1a1,
        fontFamily: "monospace",
        fontSize: 12,
      });

      text.x = scale(node);
      text.y = height - AXIS_HEIGHT + 3;
      text.anchor.set(0.5, 0);

      text.updateText(); // TODO: Should not need to call this

      this.nodeByKeyValue.set(format(node), text);
      this.addChild(text);
    }

    for (const node of update) {
      const text = this.nodeByKeyValue.get(format(node))!;

      text.x = scale(node);
      text.y = height - AXIS_HEIGHT + 3;
    }

    for (const node of exit) {
      const text = this.nodeByKeyValue.get(node)!;

      this.nodeByKeyValue.delete(node);
      this.removeChild(text);
    }
  }
}
