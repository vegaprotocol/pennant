import { bisectLeft, bisectRight, zip } from "d3-array";
import { Delaunay } from "d3-delaunay";
import { ScaleLinear, scaleLinear } from "d3-scale";
import EventEmitter from "eventemitter3";
import { clamp } from "lodash";

import { bisectCenter } from "../../math/array";
import { Renderer } from "../../renderer";
import { Container } from "../../renderer/display";
import { InteractionData } from "../../renderer/interaction/interaction-data";
import { InteractionEvent } from "../../renderer/interaction/interaction-event";
import { Rectangle } from "../../renderer/math";
import { AXIS_HEIGHT } from "../depth-chart";
import { Colors } from "../depth-chart/helpers";
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

const OVERLAY_OPACITY = 0.05;

type UiColors = Pick<
  Colors,
  | "backgroundSurface"
  | "buyStroke"
  | "sellStroke"
  | "textPrimary"
  | "textSecondary"
>;

function pointer(event: any) {
  const node = event.target;

  const rect = node.getBoundingClientRect();

  return [
    event.clientX - rect.left - node.clientLeft,
    event.clientY - rect.top - node.clientTop,
  ];
}

export class Gesture {
  public that: UI;
  public active: number = 0;
  public taps: number = 0;

  public touch0: any = null;
  public touch1: any = null;

  public sourceEvent: Event | null = null;

  public wheel: number | null = null;

  public zooming = false;

  constructor(that: UI) {
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
export class UI extends EventEmitter {
  public stage: Container = new Container();
  public renderer: Renderer;

  /**
   * The scale extent to the specified array of numbers [k0, k1] where k0 is the minimum allowed scale factor
   * and k1 is the maximum allowed scale factor.
   */
  public scaleExtent = [0, Infinity];

  public colors: UiColors;

  private data: { date: Date; price: number }[] = [];
  private priceScale: ScaleLinear<number, number> = scaleLinear();

  /**
   * The current scale.
   */
  private transform: number = 1;

  private horizontalAxis: HorizontalAxis = new HorizontalAxis();
  private verticalAxis: VerticalAxis = new VerticalAxis();

  private lastEvent: InteractionEvent | null = null;

  private gesture = new Gesture(this);
  private originalTransform: number = 1;

  constructor(options: {
    view: HTMLCanvasElement;
    resolution: number;
    width: number;
    height: number;
    colors: UiColors;
  }) {
    super();

    this.renderer = new Renderer({
      view: options.view,
      resolution: options.resolution,
      width: options.width,
      height: options.height,
    });

    this.colors = options.colors;

    const resolution = this.renderer.resolution;

    this.stage.addChild(this.horizontalAxis);
    this.stage.addChild(this.verticalAxis);

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
    data: { date: Date; price: number }[],
    priceScale: ScaleLinear<number, number>,
    volumeScale: ScaleLinear<number, number>
  ): void {
    this.data = data;
    this.priceScale = priceScale;

    console.log("UI update");

    const width = this.renderer.view.width;
    const height = this.renderer.view.height;
    const resolution = this.renderer.resolution;

    this.horizontalAxis.update(
      this.priceScale,
      width,
      height,
      resolution,
      this.colors
    );

    this.verticalAxis.update(
      volumeScale,
      width,
      height,
      resolution,
      this.colors
    );

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
  };

  public destroy() {
    this.stage.destroy();

    this.renderer.destroy();
  }

  private onPointerOut = () => {
    this.lastEvent = null;

    this.render();
  };
}
