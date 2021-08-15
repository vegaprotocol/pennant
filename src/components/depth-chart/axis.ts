import { bisectLeft, bisectRight } from "d3-array";
import { ScaleLinear, scaleLinear } from "d3-scale";
import EventEmitter from "eventemitter3";
import { clamp } from "lodash";

import { bisectCenter } from "../../math/array";
import { Renderer } from "../../renderer";
import { Container } from "../../renderer/display";
import { InteractionData } from "../../renderer/interaction/interaction-data";
import { InteractionEvent } from "../../renderer/interaction/interaction-event";
import { Rectangle } from "../../renderer/math";
import { AXIS_HEIGHT, BUY_STROKE, GRAY, SELL_STROKE } from "./depth-chart";
import {
  HorizontalAxis,
  HorizontalLine,
  Indicator,
  Label,
  MidMarketPriceLabel,
  Rect,
  VerticalAxis,
  VerticalLine,
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

  public wheel: number | null = null;

  public zooming = false;

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

/**
 * Reponsible for drawing axes and handling interactivity for depth chart
 */
export class Axis extends EventEmitter {
  public stage: Container = new Container();
  public renderer: Renderer;

  /**
   * The scale extent to the specified array of numbers [k0, k1] where k0 is the minimum allowed scale factor
   * and k1 is the maximum allowed scale factor.
   */
  public scaleExtent = [0, Infinity];

  private prices: number[] = [];
  private volumes: number[] = [];
  private priceLabels: string[] = [];
  private volumeLabels: string[] = [];
  private priceScale: ScaleLinear<number, number> = scaleLinear();
  private midMarketPrice: number = 0;

  /**
   * The current scale.
   */
  private transform: number = 1;

  private horizontalAxis: HorizontalAxis = new HorizontalAxis();
  private verticalAxis: VerticalAxis = new VerticalAxis();

  private buyIndicator: Indicator = new Indicator(BUY_STROKE);
  private sellIndicator: Indicator = new Indicator(SELL_STROKE);

  private buyPriceText = new Label();
  private buyVolumeText = new Label();

  private sellPriceText = new Label();
  private sellVolumeText = new Label();

  private buyOverlay: Rect = new Rect(0x0, 0.5);
  private sellOverlay: Rect = new Rect(0x0, 0.5);

  private midMarketPriceLabel: MidMarketPriceLabel = new MidMarketPriceLabel();
  private midPriceLine: VerticalLine = new VerticalLine(1, GRAY);

  private separator: HorizontalLine = new HorizontalLine(1, GRAY);

  private lastEvent: InteractionEvent | null = null;

  private gesture = new Gesture(this);
  private originalTransform: number = 1;

  constructor(options: {
    view: HTMLCanvasElement;
    resolution: number;
    width: number;
    height: number;
  }) {
    super();

    this.renderer = new Renderer({
      view: options.view,
      resolution: options.resolution,
      width: options.width,
      height: options.height,
    });

    const resolution = this.renderer.resolution;

    this.separator.update(
      options.height - resolution * AXIS_HEIGHT,
      options.width
    );

    this.buyPriceText.visible = false;
    this.buyVolumeText.visible = false;

    this.sellPriceText.visible = false;
    this.sellVolumeText.visible = false;

    this.stage.addChild(this.buyOverlay);
    this.stage.addChild(this.sellOverlay);
    this.stage.addChild(this.buyIndicator);
    this.stage.addChild(this.sellIndicator);
    this.stage.addChild(this.horizontalAxis);
    this.stage.addChild(this.verticalAxis);
    this.stage.addChild(this.midPriceLine);
    this.stage.addChild(this.midMarketPriceLabel);
    this.stage.addChild(this.buyPriceText);
    this.stage.addChild(this.buyVolumeText);
    this.stage.addChild(this.sellPriceText);
    this.stage.addChild(this.sellVolumeText);
    this.stage.addChild(this.separator);

    this.stage.interactive = true;
    this.stage.hitArea = new Rectangle(0, 0, options.width, options.height);

    this.stage
      .on("wheel", (event: InteractionEvent) => {
        const tempEvent = event.data?.originalEvent as WheelEvent;

        if (this.gesture.wheel) {
          window.clearTimeout(this.gesture.wheel);
        } else {
          this.gesture.start();
        }

        const k = Math.pow(
          2,
          -tempEvent.deltaY * 0.002 * (tempEvent.ctrlKey ? 10 : 1)
        );

        this.transform = clamp(
          this.transform * k,
          this.scaleExtent[0],
          this.scaleExtent[1]
        );

        this.gesture.wheel = window.setTimeout(() => {
          this.gesture.wheel = null;
          this.gesture.end();
        }, 150);

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
            this.originalTransform = this.transform;
            this.gesture.start();
          }
        }
      })
      .on("touchmove", (event) => {
        if (event.data.originalEvent instanceof TouchEvent) {
          event.data.originalEvent.preventDefault();
          event.data.originalEvent.stopImmediatePropagation();

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

            const k = Math.sqrt(dp / dl);

            this.transform = clamp(
              this.originalTransform * k,
              this.scaleExtent[0],
              this.scaleExtent[1]
            );

            this.gesture.zoom(
              clamp(this.transform, this.scaleExtent[0], this.scaleExtent[1])
            );
          }
        }
      })
      .on("touchend", (event) => {
        if (event.data.originalEvent instanceof TouchEvent) {
          const touches = event.data.originalEvent.changedTouches ?? [];

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
      })
      .on("pointermove", this.onPointerMove)
      .on("pointerout", this.onPointerOut);
  }

  public render(): void {
    this.renderer.render(this.stage);
  }

  public update(
    prices: number[],
    volumes: number[],
    midMarketPrice: number,
    priceLabels: string[],
    volumeLabels: string[],
    midMarketPriceLabel: string,
    priceScale: ScaleLinear<number, number>,
    volumeScale: ScaleLinear<number, number>
  ): void {
    this.prices = prices;
    this.volumes = volumes;
    this.midMarketPrice = midMarketPrice;
    this.priceLabels = priceLabels;
    this.volumeLabels = volumeLabels;
    this.priceScale = priceScale;

    const width = this.renderer.view.width;
    const height = this.renderer.view.height;
    const resolution = this.renderer.resolution;

    this.horizontalAxis.update(this.priceScale, width, height, resolution);
    this.verticalAxis.update(volumeScale, width, height, resolution);

    this.midMarketPriceLabel.update(
      midMarketPriceLabel,
      width / 2,
      10,
      {
        x: 0.5,
        y: 0,
      },
      resolution
    );

    this.midPriceLine.update(width / 2, height, resolution);
    this.separator.update(height - resolution * AXIS_HEIGHT, width);

    this.stage.hitArea = new Rectangle(
      0,
      0,
      this.renderer.screen.width,
      this.renderer.screen.height
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
    if ("ontouchstart" in self) return;

    this.lastEvent = event;

    let x = event.data?.global.x;

    if (x && this.prices.length > 1) {
      const resolution = this.renderer.resolution;
      x *= resolution;

      const width = this.renderer.view.width;
      const height = this.renderer.view.height;

      const index = bisectCenter(this.prices, x);
      const nearestX = this.prices[index];

      let buyIndex;
      let sellIndex;
      let buyNearestX;
      let sellNearestX;

      if (x > width / 2) {
        buyIndex = bisectLeft(
          this.prices,
          2 * this.priceScale(this.midMarketPrice) - nearestX
        );
        sellIndex = index;

        buyNearestX = 2 * this.priceScale(this.midMarketPrice) - nearestX;
        sellNearestX = nearestX;
      } else {
        buyIndex = index;
        sellIndex =
          bisectRight(
            this.prices,
            2 * this.priceScale(this.midMarketPrice) - nearestX
          ) - 1;

        buyNearestX = nearestX;
        sellNearestX = 2 * this.priceScale(this.midMarketPrice) - nearestX;
      }

      this.buyPriceText.update(
        this.priceLabels[buyIndex],
        Math.min(
          Math.max(buyNearestX, this.buyPriceText.width / 2 + 2),
          width / 2 - this.buyPriceText.width / 2 - resolution * 2
        ),
        height - (resolution * AXIS_HEIGHT) / 2,
        { x: 0.5, y: 0.5 },
        resolution
      );

      this.buyVolumeText.update(
        this.volumeLabels[buyIndex],
        width / 2 - buyNearestX > this.buyVolumeText.width + 6
          ? width / 2 - resolution * 2
          : buyNearestX - 6,
        Math.min(
          Math.max(this.volumes[buyIndex], this.buyVolumeText.height / 2 + 2),
          height - resolution * AXIS_HEIGHT - this.buyVolumeText.height / 2 - 2
        ),
        { x: 1, y: 0.5 },
        resolution
      );

      this.sellPriceText.update(
        this.priceLabels[sellIndex],
        Math.max(
          Math.min(sellNearestX, width - this.sellPriceText.width / 2 - 2),
          width / 2 + this.sellPriceText.width / 2 + resolution * 2
        ),
        height - (resolution * AXIS_HEIGHT) / 2,
        { x: 0.5, y: 0.5 },
        resolution
      );

      this.sellVolumeText.update(
        this.volumeLabels[sellIndex],
        sellNearestX - width / 2 > this.sellVolumeText.width + 6
          ? width / 2 + resolution * 3
          : sellNearestX + 6,
        Math.min(
          Math.max(this.volumes[sellIndex], this.sellVolumeText.height / 2 + 2),
          height - resolution * AXIS_HEIGHT - this.sellVolumeText.height / 2 - 2
        ),
        { x: 0, y: 0.5 },
        resolution
      );

      this.buyIndicator.update(buyNearestX, this.volumes[buyIndex], width);

      this.sellIndicator.update(sellNearestX, this.volumes[sellIndex], width);

      this.buyOverlay.update(
        0,
        0,
        buyNearestX,
        height - resolution * AXIS_HEIGHT
      );

      this.sellOverlay.update(
        sellNearestX,
        0,
        width - sellNearestX,
        height - resolution * AXIS_HEIGHT
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

    this.renderer.destroy();
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
}
