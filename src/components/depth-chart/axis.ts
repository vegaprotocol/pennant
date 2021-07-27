import { bisect } from "d3-array";
import { Renderer } from "../../pixijs";
import { Container } from "../../pixijs/display";
import { InteractionEvent } from "../../pixijs/interaction/interaction-event";
import { Rectangle } from "../../pixijs/math";
import { Text } from "../../pixijs/text";
import {
  AXIS_HEIGHT,
  GRAY,
  HEIGHT,
  STROKE_BUY_LIGHT,
  STROKE_SELL_LIGHT,
  WIDTH,
} from "./depth-chart";
import { HorizontalLine, Indicator, Label, Rect } from "./display-objects";

export class Axis {
  public stage: Container = new Container();
  public renderer: Renderer;

  public buyIndicator: Indicator = new Indicator(STROKE_BUY_LIGHT);
  public sellIndicator: Indicator = new Indicator(STROKE_SELL_LIGHT);

  public buyPriceText = new Text("", {
    fill: 0xffffff,
    fontSize: 12,
  });

  public buyVolumeText = new Label();

  public sellPriceText = new Text("", {
    fill: 0xffffff,
    fontSize: 12,
  });

  public sellVolumeText = new Label();

  public buyOverlay: Rect = new Rect(0x0, 0.5);
  public sellOverlay: Rect = new Rect(0x0, 0.5);

  public separator: HorizontalLine = new HorizontalLine(1, GRAY);

  public prices: number[] = [];
  public volumes: number[] = [];
  public priceLabels: string[] = [];
  public volumeLabels: string[] = [];

  private lastEvent: InteractionEvent | null = null;

  constructor(view: HTMLCanvasElement) {
    this.renderer = new Renderer({
      view: view,
      resolution: 1.5,
      width: WIDTH,
      height: HEIGHT,
    });

    this.separator.update(HEIGHT - AXIS_HEIGHT);

    this.buyPriceText.visible = false;
    this.buyPriceText.y = HEIGHT - AXIS_HEIGHT + 3;
    this.buyPriceText.anchor.x = 0.5;

    this.buyVolumeText.visible = false;

    this.sellPriceText.visible = false;
    this.sellPriceText.y = HEIGHT - AXIS_HEIGHT + 3;
    this.sellPriceText.anchor.x = 0.5;

    this.sellVolumeText.visible = false;

    this.stage.addChild(this.buyOverlay);
    this.stage.addChild(this.sellOverlay);

    this.stage.addChild(this.buyIndicator);
    this.stage.addChild(this.sellIndicator);

    this.stage.addChild(this.separator);

    this.stage.addChild(this.buyPriceText);
    this.stage.addChild(this.buyVolumeText);
    this.stage.addChild(this.sellPriceText);
    this.stage.addChild(this.sellVolumeText);

    this.stage.interactive = true;
    this.stage.hitArea = new Rectangle(0, 0, WIDTH, HEIGHT);
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
    volumeLabels: string[]
  ): void {
    this.prices = prices;
    this.volumes = volumes;
    this.priceLabels = priceLabels;
    this.volumeLabels = volumeLabels;

    if (this.lastEvent) {
      this.onPointerMove(this.lastEvent);
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

      if (x > WIDTH / 2) {
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
        WIDTH / 2 - this.buyPriceText.width / 2 - 2
      );

      this.buyPriceText.text = this.priceLabels[buyIndex];

      this.buyVolumeText.update(
        this.volumeLabels[buyIndex],
        WIDTH / 2 - buyNearestX > this.buyVolumeText.width + 6
          ? WIDTH / 2 - 2
          : buyNearestX - 6,
        Math.min(
          Math.max(this.volumes[buyIndex], this.buyVolumeText.height / 2 + 2),
          HEIGHT - AXIS_HEIGHT - this.buyVolumeText.height / 2 - 2
        ),
        { x: 1, y: 0.5 }
      );

      this.sellPriceText.x = Math.max(
        Math.min(sellNearestX, WIDTH - this.buyPriceText.width / 2 - 2),
        WIDTH / 2 + this.buyPriceText.width / 2 + 2,
        Math.min(
          Math.max(this.volumes[buyIndex], this.buyVolumeText.height / 2 + 2),
          HEIGHT - AXIS_HEIGHT - this.buyVolumeText.height / 2 - 2
        )
      );

      this.sellPriceText.text = this.priceLabels[sellIndex];

      this.sellVolumeText.update(
        this.volumeLabels[sellIndex],
        sellNearestX - WIDTH / 2 > this.sellVolumeText.width + 6
          ? WIDTH / 2 + 2
          : sellNearestX + 6,
        Math.min(
          Math.max(this.volumes[sellIndex], this.sellVolumeText.height / 2 + 2),
          HEIGHT - AXIS_HEIGHT - this.sellVolumeText.height / 2 - 2
        ),
        { x: 0, y: 0.5 }
      );

      this.buyIndicator.update(buyNearestX, this.volumes[buyIndex]);
      this.sellIndicator.update(sellNearestX, this.volumes[sellIndex]);

      this.buyOverlay.update(0, 0, buyNearestX, HEIGHT - AXIS_HEIGHT);

      this.sellOverlay.update(
        sellNearestX,
        0,
        WIDTH - sellNearestX,
        HEIGHT - AXIS_HEIGHT
      );

      //requestAnimationFrame(() => this.render());
      this.render();
    }
  };

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
