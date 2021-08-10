import { ScaleLinear, scaleLinear } from "d3-scale";
import EventEmitter from "eventemitter3";
import { clamp } from "lodash";

import { bisectCenter } from "../../math/array";
import { Renderer } from "../../renderer";
import { Container } from "../../renderer/display";
import { InteractionData } from "../../renderer/interaction/interaction-data";
import { InteractionEvent } from "../../renderer/interaction/interaction-event";
import { Rectangle } from "../../renderer/math";
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

function pointer(event: any) {
  const node = event.target;

  const rect = node.getBoundingClientRect();

  return [
    event.clientX - rect.left - node.clientLeft,
    event.clientY - rect.top - node.clientTop,
  ];
}
export class Gesture {
  public that: Axis;
  public active: number = 0;
  public taps: number = 0;

  public touch0: any = null;
  public touch1: any = null;

  public sourceEvent: Event | null = null;

  public zooming = false;

  public originalSpan: number = 1;

  constructor(that: Axis) {
    this.that = that;
  }

  public start() {
    this.that.emit("zoomstart");
  }

  public zoom(scale: number) {
    this.that.emit("zoom", scale);
  }

  public end() {
    this.that.emit("zoomend");
  }
}

export class Axis extends EventEmitter {
  public stage: Container = new Container();
  public renderer: Renderer;

  public transform: number = 1;

  public horizontalAxis: HorizontalAxis = new HorizontalAxis();
  public verticalAxis: VerticalAxis = new VerticalAxis();

  public buyIndicator: Indicator = new Indicator(STROKE_BUY_LIGHT);
  public sellIndicator: Indicator = new Indicator(STROKE_SELL_LIGHT);

  public buyPriceText = new Label();
  public buyVolumeText = new Label();

  public sellPriceText = new Label();
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

  public zoomExtent = [1, 10];

  private lastEvent: InteractionEvent | null = null;

  private gesture = new Gesture(this);

  // TODO: type options
  constructor(options: any) {
    super();

    this.renderer = new Renderer({
      view: options.view,
      resolution: options.resolution,
      width: options.width,
      height: options.height,
    });

    this.separator.update(options.height - AXIS_HEIGHT, options.width);

    this.buyPriceText.visible = false;
    this.buyVolumeText.visible = false;

    this.sellPriceText.visible = false;
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
      .on("pointerout", this.onPointerOut)
      .on("wheel", (event: InteractionEvent) => {
        const tempEvent = event.data?.originalEvent as WheelEvent;

        const change = Math.pow(
          2,
          -tempEvent.deltaY * 0.002 * (tempEvent.ctrlKey ? 10 : 1)
        );

        this.transform = clamp(
          this.transform * change,
          this.zoomExtent[0],
          this.zoomExtent[1]
        );

        this.emit("zoom", this.transform);
      })
      .on("touchstart", (event) => {
        if (event.data.originalEvent instanceof TouchEvent) {
          const originalEvent = event.data.originalEvent;

          const touches = originalEvent.touches;
          let started = false;

          originalEvent.stopImmediatePropagation();

          for (const touch of touches) {
            const p = pointer(touch);

            if (!this.gesture.touch0) {
              this.gesture.touch0 = {
                point: p,
                originalPoint: p,
                identifier: touch.identifier,
              };

              started = true;
            } else if (
              !this.gesture.touch1 &&
              this.gesture.touch0.identifier !== touch.identifier
            ) {
              this.gesture.touch1 = {
                point: p,
                originalPoint: p,
                identifier: touch.identifier,
              };

              this.gesture.taps = 0;
            }
          }

          if (started) {
            this.gesture.start();
          }
        }

        //setMessage(`touchstart: ${JSON.stringify(gesture)}`);
      })
      .on("touchmove", (event) => {
        if (event.data.originalEvent instanceof TouchEvent) {
          const touches = event.data.originalEvent.changedTouches ?? [];

          for (const touch of touches) {
            if (
              this.gesture.touch0 &&
              this.gesture.touch0.identifier === touch.identifier
            ) {
              this.gesture.touch0.point = pointer(touch);
            } else if (
              this.gesture.touch1 &&
              this.gesture.touch1.identifier === touch.identifier
            ) {
              this.gesture.touch1.point = pointer(touch);
            }
          }

          if (this.gesture.touch1) {
            const p0 = this.gesture.touch0.point;
            const p1 = this.gesture.touch1.point;

            const l0 = this.gesture.touch0.originalPoint;
            const l1 = this.gesture.touch1.originalPoint;

            const dp = (p1[0] - p0[0]) ** 2 + (p1[1] - p0[1]) ** 2;
            const dl = (l1[0] - l0[0]) ** 2 + (l1[1] - l0[1]) ** 2;

            const scale = Math.sqrt(dp / dl);

            this.gesture.zoom(
              clamp(scale, this.zoomExtent[0], this.zoomExtent[1])
            );

            //setMessage(`touchmove: ${JSON.stringify(scale)}`);
          }
        }
      })
      .on("touchend", (event) => {
        if (event.data.originalEvent instanceof TouchEvent) {
          const touches = event.data.originalEvent.changedTouches ?? [];

          console.log(touches);

          for (const touch of touches) {
            if (
              this.gesture.touch0 &&
              this.gesture.touch0.identifier === touch.identifier
            ) {
              this.gesture.touch0 = null;
            } else if (
              this.gesture.touch1 &&
              this.gesture.touch1.identifier === touch.identifier
            ) {
              this.gesture.touch1 = null;
            }
          }

          if (this.gesture.touch1 && !this.gesture.touch0) {
            this.gesture.touch0 = null;
            this.gesture.touch1 = null;
          }

          this.gesture.end();
        }
      });
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
    }
  }

  public updatePrice(price: number) {
    const event = new InteractionEvent();
    event.data = new InteractionData();
    event.data.global.x = this.priceScale(price);

    this.onPointerMove(event);
  }

  public clearPrice() {
    this.onPointerOut();
  }

  private onPointerMove = (event: InteractionEvent) => {
    this.lastEvent = event;

    let x = event.data?.global.x;

    if (x && this.prices.length > 1) {
      const index = bisectCenter(this.prices, x);
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

      this.buyPriceText.update(
        this.priceLabels[buyIndex],
        Math.min(
          Math.max(buyNearestX, this.buyPriceText.width / 2 + 2),
          this.renderer.screen.width / 2 - this.buyPriceText.width / 2 - 2
        ),
        this.renderer.screen.height - AXIS_HEIGHT + 3,
        { x: 0.5, y: 0 }
      );

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

      this.sellPriceText.update(
        this.priceLabels[sellIndex],
        Math.max(
          Math.min(
            sellNearestX,
            this.renderer.screen.width - this.sellPriceText.width / 2 - 2
          ),
          this.renderer.screen.width / 2 + this.sellPriceText.width / 2 + 2
        ),
        this.renderer.screen.height - AXIS_HEIGHT + 3,
        { x: 0.5, y: 0 }
      );

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

      // TODO: Changing visibility in groups like this suggests they should be in a Container
      if (this.priceScale.invert(buyNearestX) > this.priceScale.domain()[0]) {
        this.buyPriceText.visible = true;
        this.buyVolumeText.visible = true;
        this.buyIndicator.visible = true;
        this.buyOverlay.visible = true;
      } else {
        this.buyPriceText.visible = false;
        this.buyVolumeText.visible = false;
        this.buyIndicator.visible = false;
        this.buyOverlay.visible = false;
      }

      if (this.priceScale.invert(sellNearestX) < this.priceScale.domain()[1]) {
        this.sellPriceText.visible = true;
        this.sellVolumeText.visible = true;
        this.sellIndicator.visible = true;
        this.sellOverlay.visible = true;
      } else {
        this.sellPriceText.visible = false;
        this.sellVolumeText.visible = false;
        this.sellIndicator.visible = false;
        this.sellOverlay.visible = false;
      }

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
