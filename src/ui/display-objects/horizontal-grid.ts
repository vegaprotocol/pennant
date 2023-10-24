import { Container, Graphics } from "@ui/renderer";
import { isDate, isDateArray } from "@util/misc";
import { ScaleLinear, ScaleTime } from "@util/types";

/**
 * Draws vertical grid lines
 */
export class HorizontalGrid extends Container {
  /**
   * Cache ticks
   */
  private nodeByKeyValue = new Map<number, Graphics>();
  private color: number;

  constructor(color = 0x3d3d3d) {
    super();
    this.color = color;
  }

  public update(
    scale: ScaleLinear | ScaleTime,
    width: number,
    height: number,
    resolution: number = 1,
  ) {
    const numTicks = width / resolution / 200;
    const ticks = scale.ticks(numTicks);

    let enter: number[] | Date[];
    let update: number[] | Date[];
    let exit: number[] | Date[];

    if (isDateArray(ticks)) {
      enter = ticks.filter((tick) => !this.nodeByKeyValue.has(tick.getTime()));
    } else {
      enter = ticks.filter((tick) => !this.nodeByKeyValue.has(tick));
    }

    if (isDateArray(ticks)) {
      update = ticks.filter((tick) => this.nodeByKeyValue.has(tick.getTime()));
    } else {
      update = ticks.filter((tick) => this.nodeByKeyValue.has(tick));
    }

    if (isDateArray(ticks)) {
      exit = [...this.nodeByKeyValue.keys()].filter(
        (node) => !(ticks.map((tick) => tick.getTime()).indexOf(node) !== -1),
      );
    } else {
      exit = [...this.nodeByKeyValue.keys()].filter(
        (node) => !(ticks.map((tick) => tick).indexOf(node) !== -1),
      );
    }

    for (const node of enter) {
      const line = new Graphics();

      line.clear();
      line.lineStyle({
        width: 1,
        color: this.color,
        lineDash: [],
      });
      line.moveTo(0.5, 0);
      line.lineTo(0.5, height);
      line.endFill();
      line.x = scale(node);

      this.nodeByKeyValue.set(isDate(node) ? node.getTime() : node, line);
      this.addChild(line);
    }

    for (const node of update) {
      const line = this.nodeByKeyValue.get(
        isDate(node) ? node.getTime() : node,
      )!;

      line.clear();
      line.lineStyle({
        width: 1,
        color: this.color,
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
