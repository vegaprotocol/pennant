import { ScaleLinear } from "d3-scale";

import { Container } from "../../../renderer/display";
import { Text } from "../../../renderer/text";

export class VerticalAxis extends Container {
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

      t.x = width - 3;
      t.y = scale(tick);
      t.anchor.set(1, 0.5);

      return t;
    });

    if (ticks.length > 0) {
      this.addChild(...text);
    }
  }
}
