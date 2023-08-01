import { Container, Graphics } from "@ui/renderer";

import { Colors } from "../../feature/line-chart/helpers";
import { Text } from "../renderer/text";

type LabelColors = Pick<Colors, "backgroundSurface" | "textPrimary">;

/**
 * Draw a label
 */
export class Label extends Container {
  private text: Text = new Text("", {
    fill: 0xffffff,
    fontFamily: "monospace",
    fontSize: 12,
  });

  private background: Graphics = new Graphics();

  constructor() {
    super();

    this.addChild(this.background);
    this.addChild(this.text);
  }

  public update(
    text: string,
    x: number,
    y: number,
    anchor: { x: number; y: number },
    resolution: number = 1,
    colors: LabelColors,
  ) {
    this.text.x = x;
    this.text.y = y;
    this.text.text = text;
    this.text.anchor.x = anchor.x;
    this.text.anchor.y = anchor.y;
    this.text.style.fill = colors.textPrimary;

    const width = resolution * this.text.width;
    const height = resolution * this.text.height;

    const anchorX = anchor.x;
    const anchorY = anchor.y;

    const padding = resolution * 1.2;

    this.background.clear();
    this.background.beginFill(colors.backgroundSurface, 1);

    this.background.drawRect(
      x - (anchorX * width + padding),
      y - (anchorY * height + padding),
      width + 2 * padding,
      height + 2 * padding,
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
