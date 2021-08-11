import { Container } from "../../../renderer/display";
import { Graphics } from "../../../renderer/graphics";
import { Text } from "../../../renderer/text";

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
