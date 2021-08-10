import { Container } from "../../../renderer/display";
import { Graphics } from "../../../renderer/graphics";
import { Text } from "../../../renderer/text";

export class MidMarketPriceLabel extends Container {
  public price: Text = new Text("9999", {
    fill: 0xffffff,
    fontSize: 18,
  });

  public label: Text = new Text("Mid Market Price", {
    fill: 0xa1a1a1,
    fontSize: 12,
  });

  public background: Graphics = new Graphics();

  constructor() {
    super();

    this.addChild(this.background);
    this.addChild(this.label);
    this.addChild(this.price);
  }

  public update(
    text: string,
    x: number,
    y: number,
    anchor: { x: number; y: number }
  ) {
    this.price.x = x;
    this.price.y = y;
    this.price.text = text;
    this.price.anchor.x = anchor.x;
    this.price.anchor.y = anchor.y;

    this.label.x = x;
    this.label.anchor.x = anchor.x;
    this.label.anchor.y = anchor.y;

    const width = Math.max(this.price.width, this.label.width);
    const height = this.price.height + this.label.height;

    this.label.y = y + this.price.height;

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
    return this.price.width;
  }

  get height() {
    return this.price.height + this.label.height;
  }
}
