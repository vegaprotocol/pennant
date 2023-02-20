import { Container } from "../../renderer/display";
import { Graphics } from "../../renderer/graphics";
import { ScaleTime } from "../../types";

/**
 * Draws vertical grid lines
 */
export class HorizontalGrid extends Container {
  /**
   * Cache ticks
   */
  private nodeByKeyValue = new Map<number, Graphics>();

  constructor() {
    super();
  }

  public update(
    scale: ScaleTime,
    width: number,
    height: number,
    resolution: number = 1
  ) {
    const numTicks = width / resolution / 200;
    const ticks = scale.ticks(numTicks);

    const enter = ticks.filter(
      (tick) => !this.nodeByKeyValue.has(tick.getTime())
    );

    const update = ticks.filter((tick) =>
      this.nodeByKeyValue.has(tick.getTime())
    );

    const exit = [...this.nodeByKeyValue.keys()].filter(
      (node) => !(ticks.map((tick) => tick.getTime()).indexOf(node) !== -1)
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

      this.nodeByKeyValue.set(node.getTime(), line);
      this.addChild(line);
    }

    for (const node of update) {
      const line = this.nodeByKeyValue.get(node.getTime())!;

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
