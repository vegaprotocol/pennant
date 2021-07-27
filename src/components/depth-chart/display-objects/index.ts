import { curveStepBefore } from "d3-shape";

import { Container } from "../../../pixijs/display";
import { Graphics } from "../../../pixijs/graphics";
import { Text } from "../../../pixijs/text";
import { AXIS_HEIGHT, HEIGHT, WIDTH } from "../depth-chart";

export class DepthCurve extends Container {
  public area: Graphics = new Graphics();
  public line: Graphics = new Graphics();

  public stroke: number;
  public fill: number;

  constructor(stroke: number = 0, fill: number = 0xffffff) {
    super();

    this.stroke = stroke;
    this.fill = fill;

    this.area.lineStyle({ width: 0 });
    this.line.lineStyle({ width: 1, color: stroke });

    this.addChild(this.area);
    this.addChild(this.line);
  }

  public update(points: [number, number][]): void {
    this.area.clear();
    this.area.beginFill(this.fill);
    this.area.drawArea(points, curveStepBefore, HEIGHT - AXIS_HEIGHT);
    this.area.endFill();

    this.line.clear();
    this.line.lineStyle({ width: 1, color: this.stroke });
    this.line.drawLine(points, curveStepBefore);
  }
}

export class VerticalLine extends Graphics {
  constructor(width = 1, color = 0xffffff, lineDash: number[] = []) {
    super();

    this.lineStyle({ width, color, lineDash });
    this.moveTo(0, 0);
    this.lineTo(0, HEIGHT - AXIS_HEIGHT);
    this.endFill();
  }

  public update(x: number) {
    this.x = x;
  }
}

export class HorizontalLine extends Graphics {
  constructor(width = 1, color = 0xffffff, lineDash: number[] = []) {
    super();

    this.lineStyle({ width, color, lineDash });
    this.moveTo(0, 0);
    this.lineTo(WIDTH, 0);
    this.endFill();
  }

  public update(y: number) {
    this.y = y;
  }
}

export class Indicator extends Container {
  public circle: Graphics = new Graphics();
  public line: Graphics = new Graphics();

  public color: number;

  constructor(color = 0xffffff) {
    super();

    this.color = color;

    this.circle.beginFill(color);
    this.circle.drawCircle(0, 0, 4);
    this.circle.endFill();

    this.addChild(this.line);
    this.addChild(this.circle);

    this.visible = false;
  }

  public update(x: number, y: number) {
    this.circle.x = x;
    this.circle.y = y;

    this.line.clear();

    this.line.lineStyle({
      width: 1,
      color: this.color,
      lineDash: [3, 3],
    });

    this.line.moveTo(x, 0);
    this.line.lineTo(x, y);
    this.line.lineTo(WIDTH / 2, y);
    this.line.endFill();
  }
}

export class Rect extends Graphics {
  public alpha = 1;
  public color = 0xffffff;

  constructor(color = 0xffffff, alpha = 1) {
    super();

    this.color = color;
    this.alpha = alpha;
  }

  public update(x: number, y: number, width: number, height: number) {
    this.clear();
    this.beginFill(this.color, this.alpha);
    this.drawRect(x, y, width, height);
    this.endFill();
  }
}

export class Label extends Container {
  public text: Text = new Text("", { fill: 0xffffff, fontSize: 12 });
  public background: Graphics = new Graphics();

  constructor() {
    super();

    this.addChild(this.background);
    this.addChild(this.text);
  }

  public update(
    text: string,
    x: number,
    y: number,
    anchor: { x: number; y: number }
  ) {
    this.text.x = x;
    this.text.y = y;
    this.text.text = text;
    this.text.anchor.x = anchor.x;
    this.text.anchor.y = anchor.y;

    const width = this.text.width;
    const height = this.text.height;

    const anchorX = anchor.x;
    const anchorY = anchor.y;

    const padding = 2;

    this.background.clear();
    this.background.beginFill(0x000000, 1);
    this.background.drawRect(
      x - (anchorX * width + padding),
      y - (anchorY * height + padding),
      width + 2 * padding,
      height + 2 * padding
    );
    this.background.endFill();
  }

  get width() {
    return this.text.width;
  }

  get height() {
    return this.text.height;
  }
}
