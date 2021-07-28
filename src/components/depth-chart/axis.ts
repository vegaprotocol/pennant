import { bisect } from "d3-array";
import { ScaleLinear, scaleLinear } from "d3-scale";

import { Renderer, Texture } from "../../renderer";
import { Container } from "../../renderer/display";
import { InteractionEvent } from "../../renderer/interaction/interaction-event";
import { Rectangle } from "../../renderer/math";
import { Sprite } from "../../renderer/sprite";
import { Text } from "../../renderer/text";
import {
  AXIS_HEIGHT,
  GRAY,
  STROKE_BUY_LIGHT,
  STROKE_SELL_LIGHT,
} from "./depth-chart";
import {
  HorizontalAxis,
  HorizontalLine,
  Indicator,
  Label,
  MidMarketPriceLabel,
  Rect,
  VerticalAxis,
} from "./display-objects";

export class Axis {
  public stage: Container = new Container();
  public renderer: Renderer;

  public horizontalAxis: HorizontalAxis = new HorizontalAxis();
  public verticalAxis: VerticalAxis = new VerticalAxis();

  public buyIndicator: Indicator = new Indicator(STROKE_BUY_LIGHT);
  public sellIndicator: Indicator = new Indicator(STROKE_SELL_LIGHT);

  public buyPriceText = new Text("", {
    fill: 0xffffff,
    fontFamily: "monospace",
    fontSize: 12,
  });

  public buyVolumeText = new Label();

  public sellPriceText = new Text("", {
    fill: 0xffffff,
    fontFamily: "monospace",
    fontSize: 12,
  });

  public sellVolumeText = new Label();

  public buyOverlay: Rect = new Rect(0x0, 0.5);
  public sellOverlay: Rect = new Rect(0x0, 0.5);

  public midMarketPriceLabel: MidMarketPriceLabel = new MidMarketPriceLabel();

  public separator: HorizontalLine = new HorizontalLine(1, GRAY);

  public prices: number[] = [];
  public volumes: number[] = [];
  public priceLabels: string[] = [];
  public volumeLabels: string[] = [];
  public priceScale: ScaleLinear<number, number> = scaleLinear();

  private lastEvent: InteractionEvent | null = null;

  // TODO: type options
  constructor(options: any) {
    this.renderer = new Renderer({
      view: options.view,
      resolution: options.resolution,
      width: options.width,
      height: options.height,
    });

    this.separator.update(options.height - AXIS_HEIGHT, options.width);

    this.buyPriceText.visible = false;
    this.buyPriceText.y = options.height - AXIS_HEIGHT + 3;
    this.buyPriceText.anchor.x = 0.5;

    this.buyVolumeText.visible = false;

    this.sellPriceText.visible = false;
    this.sellPriceText.y = options.height - AXIS_HEIGHT + 3;
    this.sellPriceText.anchor.x = 0.5;

    this.sellVolumeText.visible = false;

    this.stage.addChild(this.buyOverlay);
    this.stage.addChild(this.sellOverlay);

    this.stage.addChild(this.buyIndicator);
    this.stage.addChild(this.sellIndicator);

    this.stage.addChild(this.separator);

    this.stage.addChild(this.horizontalAxis);
    this.stage.addChild(this.verticalAxis);

    this.stage.addChild(this.midMarketPriceLabel);

    this.stage.addChild(this.buyPriceText);
    this.stage.addChild(this.buyVolumeText);
    this.stage.addChild(this.sellPriceText);
    this.stage.addChild(this.sellVolumeText);

    this.stage.interactive = true;
    this.stage.hitArea = new Rectangle(0, 0, options.width, options.height);
    this.stage
      .on("pointermove", this.onPointerMove)
      .on("pointerout", this.onPointerOut);
  }

  public render(): void {
    this.renderer.render(this.stage);
  }

  public update(
    prices: number[],
    volumes: number[],
    priceLabels: string[],
    volumeLabels: string[],
    midMarketPrice: string,
    priceScale: ScaleLinear<number, number>,
    volumeScale: ScaleLinear<number, number>
  ): void {
    this.prices = prices;
    this.volumes = volumes;
    this.priceLabels = priceLabels;
    this.volumeLabels = volumeLabels;
    this.priceScale = priceScale;

    this.horizontalAxis.update(
      this.priceScale,
      this.renderer.screen.width,
      this.renderer.screen.height
    );

    this.verticalAxis.update(
      volumeScale,
      this.renderer.screen.width,
      this.renderer.screen.height
    );

    this.midMarketPriceLabel.update(
      midMarketPrice,
      this.renderer.screen.width / 2,
      10,
      { x: 0.5, y: 0 }
    );

    if (this.lastEvent) {
      this.onPointerMove(this.lastEvent);
    } else {
      this.render();
    }
  }

  private onPointerMove = (event: InteractionEvent) => {
    this.lastEvent = event;

    let x = event.data?.global.x;

    if (x && this.prices.length > 1) {
      this.buyPriceText.visible = true;
      this.buyVolumeText.visible = true;
      this.sellPriceText.visible = true;
      this.sellVolumeText.visible = true;

      this.buyIndicator.visible = true;
      this.sellIndicator.visible = true;

      this.buyOverlay.visible = true;
      this.sellOverlay.visible = true;

      const index = bisect(this.prices, x);
      const nearestX = this.prices[index];

      let buyIndex;
      let sellIndex;
      let buyNearestX;
      let sellNearestX;

      if (x > this.renderer.screen.width / 2) {
        buyIndex = this.prices.length - index - 1;
        sellIndex = index;
        buyNearestX = this.prices[buyIndex];
        sellNearestX = nearestX;
      } else {
        buyIndex = index;
        sellIndex = this.prices.length - index - 1;
        buyNearestX = nearestX;
        sellNearestX = this.prices[sellIndex];
      }

      this.buyPriceText.x = Math.min(
        Math.max(buyNearestX, this.buyPriceText.width / 2 + 2),
        this.renderer.screen.width / 2 - this.buyPriceText.width / 2 - 2
      );

      this.buyPriceText.text = this.priceLabels[buyIndex];

      this.buyVolumeText.update(
        this.volumeLabels[buyIndex],
        this.renderer.screen.width / 2 - buyNearestX >
          this.buyVolumeText.width + 6
          ? this.renderer.screen.width / 2 - 2
          : buyNearestX - 6,
        Math.min(
          Math.max(this.volumes[buyIndex], this.buyVolumeText.height / 2 + 2),
          this.renderer.screen.height -
            AXIS_HEIGHT -
            this.buyVolumeText.height / 2 -
            2
        ),
        { x: 1, y: 0.5 }
      );

      this.sellPriceText.x = Math.max(
        Math.min(
          sellNearestX,
          this.renderer.screen.width - this.sellPriceText.width / 2 - 2
        ),
        this.renderer.screen.width / 2 + this.sellPriceText.width / 2 + 2
      );

      this.sellPriceText.text = this.priceLabels[sellIndex];

      this.sellVolumeText.update(
        this.volumeLabels[sellIndex],
        sellNearestX - this.renderer.screen.width / 2 >
          this.sellVolumeText.width + 6
          ? this.renderer.screen.width / 2 + 2
          : sellNearestX + 6,
        Math.min(
          Math.max(this.volumes[sellIndex], this.sellVolumeText.height / 2 + 2),
          this.renderer.screen.height -
            AXIS_HEIGHT -
            this.sellVolumeText.height / 2 -
            2
        ),
        { x: 0, y: 0.5 }
      );

      this.buyIndicator.update(
        buyNearestX,
        this.volumes[buyIndex],
        this.renderer.screen.width
      );

      this.sellIndicator.update(
        sellNearestX,
        this.volumes[sellIndex],
        this.renderer.screen.width
      );

      this.buyOverlay.update(
        0,
        0,
        buyNearestX,
        this.renderer.screen.height - AXIS_HEIGHT
      );

      this.sellOverlay.update(
        sellNearestX,
        0,
        this.renderer.screen.width - sellNearestX,
        this.renderer.screen.height - AXIS_HEIGHT
      );

      this.render();
    }
  };

  public destroy() {
    this.stage.destroy();
    //this.stage = null;

    this.renderer.destroy();
    //this.renderer = null;
  }

  private onPointerOut = () => {
    this.buyPriceText.visible = false;
    this.buyVolumeText.visible = false;
    this.sellPriceText.visible = false;
    this.sellVolumeText.visible = false;

    this.buyIndicator.visible = false;
    this.sellIndicator.visible = false;

    this.buyOverlay.visible = false;
    this.sellOverlay.visible = false;

    this.lastEvent = null;

    this.render();
  };

  get screen(): Rectangle {
    return this.renderer.screen;
  }
}
