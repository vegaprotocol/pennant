import { ScaleLinear } from "d3-scale";
import { CurveFactory, curveStepBefore, line } from "d3-shape";

import { Container } from "../../../renderer/display";
import { Graphics } from "../../../renderer/graphics";
import { Text } from "../../../renderer/text";
import { AXIS_HEIGHT } from "../depth-chart";

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

    const ticks = scale.ticks(width / 200);

    const text = ticks.map((tick) => {
      const t = new Text(String(tick), {
        fill: 0xffffff,
        fontFamily: "monospace",
        fontSize: 12,
      });

      t.x = scale(tick);
      t.y = height - AXIS_HEIGHT + 3;
      t.anchor.y = 0;
      t.anchor.x = 0.5;

      return t;
    });

    if (ticks.length > 0) {
      this.addChild(...text);
    }
  }
}
export class DepthCurve extends Container {
  public area: Graphics = new Graphics();
  public line: Graphics = new Graphics();

  public stroke: number;
  public fill: number;
  public curve: CurveFactory;

  constructor(
    stroke: number = 0,
    fill: number = 0xffffff,
    curve: CurveFactory = curveStepBefore
  ) {
    super();

    this.stroke = stroke;
    this.fill = fill;
    this.curve = curve;

    this.area.lineStyle({ width: 0 });
    this.line.lineStyle({ width: 1, color: stroke });

    this.addChild(this.area);
    this.addChild(this.line);
  }

  public update(points: [number, number][], height: number): void {
    this.area.clear();
    this.area.beginFill(this.fill);
    this.area.drawArea(points, this.curve, height - AXIS_HEIGHT);
    this.area.endFill();

    this.line.clear();
    this.line.lineStyle({ width: 1, color: this.stroke });
    this.line.drawLine(points, this.curve);
  }
}

export class VerticalLine extends Graphics {
  public width: number;
  public color: number;
  public lineDash: number[];

  constructor(width = 1, color = 0xffffff, lineDash: number[] = []) {
    super();

    this.width = width;
    this.color = color;
    this.lineDash = lineDash;
  }

  public update(x: number, height: number) {
    this.clear();
    this.lineStyle({
      width: this.width,
      color: this.color,
      lineDash: this.lineDash,
    });
    this.moveTo(0, 0);
    this.lineTo(0, height - AXIS_HEIGHT);
    this.endFill();
    this.x = x;
  }
}

export class HorizontalLine extends Graphics {
  public width: number;
  public color: number;
  public lineDash: number[];

  constructor(width = 1, color = 0xffffff, lineDash: number[] = []) {
    super();

    this.width = width;
    this.color = color;
    this.lineDash = lineDash;
  }

  public update(y: number, width: number) {
    this.clear();
    this.lineStyle({
      width: this.width,
      color: this.color,
      lineDash: this.lineDash,
    });
    this.moveTo(0, 0);
    this.lineTo(width, 0);
    this.endFill();
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

  public update(x: number, y: number, width: number) {
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
    this.line.lineTo(width / 2, y);
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
  public text: Text = new Text("", {
    fill: 0xffffff,
    fontFamily: "monospace",
    fontSize: 12,
  });
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
