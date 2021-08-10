import { ScaleLinear } from "d3-scale";

import { Container } from "../../../renderer/display";
import { Graphics } from "../../../renderer/graphics";
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

    const ticks = scale.ticks(height / 50);

    const texts = ticks.map((tick) => {
      const text = new Text(String(tick), {
        fill: 0xa1a1a1,
        fontFamily: "monospace",
        fontSize: 12,
      });

      text.anchor.set(1, 0.5);
      text.x = width - 7;
      text.y = scale(tick);

      text.updateText(); // TODO: Should not need to call this

      return text;
    });

    const lines = ticks.map((tick) => {
      const line = new Graphics();

      line.lineStyle({ width: 1, color: 0xa1a1a1 });
      line.moveTo(width - 4, scale(tick));
      line.lineTo(width, scale(tick));
      line.endFill();

      return line;
    });

    if (ticks.length > 0) {
      this.addChild(...texts);
      this.addChild(...lines);
    }
  }
}
