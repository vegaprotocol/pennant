import { ScaleLinear } from "d3-scale";

import { Container } from "../../../renderer/display";
import { Text } from "../../../renderer/text";
import { AXIS_HEIGHT } from "..";

export class HorizontalAxis extends Container {
  constructor() {
    super();
  }

  public update(
    scale: ScaleLinear<number, number>,
    width: number,
    height: number
  ) {
    this.removeChildren();

    const ticks = scale.ticks(width / 100);

    const text = ticks.map((tick) => {
      const t = new Text(String(tick), {
        fill: 0xa1a1a1,
        fontFamily: "monospace",
        fontSize: 12,
      });

      t.x = scale(tick);
      t.y = height - AXIS_HEIGHT + 3;
      t.anchor.set(0.5, 0);

      t.updateText(); // TODO: Should not need to call this

      return t;
    });

    if (ticks.length > 0) {
      this.addChild(...text);
    }
  }
}
