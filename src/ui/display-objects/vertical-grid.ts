import { Container, Graphics } from "@ui/renderer";
import { ScaleLinear } from "@util/types";

/**
 * Draws vertical grid lines
 */
export class VerticalGrid extends Container {
  /**
   * Cache ticks
   */
  private nodeByKeyValue = new Map<string, Graphics>();

  private color: number;

  constructor(color = 0x3d3d3d) {
    super();
    this.color = color;
  }

  public update(
    scale: ScaleLinear,
    width: number,
    height: number,
    resolution: number = 1,
  ) {
    const numTicks = height / resolution / 50;
    const ticks = scale.ticks(numTicks);
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
      const line = new Graphics();

      line.clear();
      line.lineStyle({
        width: 1,
        color: this.color,
        lineDash: [],
      });
      line.moveTo(0, 0.5);
      line.lineTo(width, 0.5);
      line.endFill();
      line.y = scale(node);

      this.nodeByKeyValue.set(tickFormat(node), line);
      this.addChild(line);
    }

    for (const node of update) {
      const line = this.nodeByKeyValue.get(tickFormat(node))!;

      line.clear();

      line.lineStyle({
        width: 1,
        color: this.color,
        lineDash: [],
      });

      line.moveTo(0, 0.5);
      line.lineTo(width, 0.5);
      line.endFill();
      line.y = scale(node);
    }

    for (const node of exit) {
      const text = this.nodeByKeyValue.get(node)!;

      this.nodeByKeyValue.delete(node);
      this.removeChild(text);
    }
  }
}
