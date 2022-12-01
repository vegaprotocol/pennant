import { ScaleTime } from "d3-scale";

import { Container } from "../../../renderer/display";
import { Text } from "../../../renderer/text";
import { Colors } from "../../depth-chart/helpers";
import { AXIS_HEIGHT, FONT_SIZE } from "../chart";

const MAX_TICKS = 20;

type HorizontalAxisColors = Pick<
  Colors,
  "backgroundSurface" | "textPrimary" | "textSecondary"
>;

const range = (start: number, stop: number, step = 1) =>
  Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + i * step);

/**
 * Draws a horizontal axis at the bottom of the chart
 */
export class HorizontalAxis extends Container {
  private tickNodes: Text[] = [];

  constructor() {
    super();

    // TODO: Dynamically scale (double etc)
    this.tickNodes = range(0, MAX_TICKS).map(
      () =>
        new Text("", {
          fill: 0xffffff,
          fontFamily: "monospace",
          fontSize: FONT_SIZE,
        })
    );

    for (let i = 0; i < this.tickNodes.length; i++) {
      this.tickNodes[i].visible = false;
      this.addChild(this.tickNodes[i]);
    }
  }

  public update(
    scale: ScaleTime<number, number>,
    width: number,
    height: number,
    resolution: number = 1,
    colors: HorizontalAxisColors
  ) {
    const numTicks = width / resolution / 200;
    const ticks = scale.ticks(numTicks);
    const tickFormat = scale.tickFormat(numTicks);

    for (let i = 0; i < this.tickNodes.length; i++) {
      this.tickNodes[i].visible = false;
    }

    for (let i = 0; i < Math.min(ticks.length, this.tickNodes.length); i++) {
      const text = this.tickNodes[i];

      text.visible = true;

      text.text = tickFormat(ticks[i]);

      text.x = scale(ticks[i]);
      text.y = height - (resolution * AXIS_HEIGHT) / 2;
      text.anchor.set(0.5, 0.5);
      text.style.fill = colors.textSecondary;

      text.updateText(); // TODO: Should not need to call this
    }
  }
}
