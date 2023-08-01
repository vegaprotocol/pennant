import { Container, Graphics, Text } from "@ui/renderer";

import { FONT_SIZE } from "../depth-chart";
import { Colors } from "../helpers";

type MidMarketPriceLabelColors = Pick<
  Colors,
  "backgroundSurface" | "textPrimary" | "textSecondary"
>;

/**
 * Draw a title and subtitle at the top of the chart
 */
export class MidMarketPriceLabel extends Container {
  private price: Text;
  private label: Text;
  private background: Graphics = new Graphics();

  constructor(colors: MidMarketPriceLabelColors) {
    super();

    this.price = new Text("9999", {
      fill: colors.textPrimary,
      fontSize: 18,
    });

    this.label = new Text("Mid Market Price", {
      fill: colors.textSecondary,
      fontSize: FONT_SIZE,
    });

    this.addChild(this.background);
    this.addChild(this.label);
    this.addChild(this.price);
  }

  public update(
    x: number,
    y: number,
    anchor: { x: number; y: number },
    resolution: number = 1,
    colors: MidMarketPriceLabelColors,
    price?: string,
    title?: string,
  ) {
    this.price.x = x;
    this.price.y = y;
    this.price.anchor.x = anchor.x;
    this.price.anchor.y = anchor.y;
    this.price.style.fill = colors.textPrimary;

    if (price) {
      this.price.text = price;
    }

    this.label.x = x;
    this.label.anchor.x = anchor.x;
    this.label.anchor.y = anchor.y;
    this.label.style.fill = colors.textSecondary;

    if (title) {
      this.label.text = title;
    }

    const width = resolution * Math.max(this.price.width, this.label.width);
    const height = resolution * (this.price.height + this.label.height);

    this.label.y = y + resolution * this.price.height;

    const anchorX = anchor.x;
    const anchorY = anchor.y;

    const padding = resolution * 4;

    this.background.clear();
    this.background.beginFill(colors.backgroundSurface, 0.9);
    this.background.drawRect(
      x - (anchorX * width + padding),
      y - (anchorY * height + padding),
      width + 2 * padding,
      height + 2 * padding,
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
