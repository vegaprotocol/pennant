import { bisectLeft, bisectRight, zip } from "d3-array";
import { Delaunay } from "d3-delaunay";
import { ScaleLinear, scaleLinear, ScaleTime, scaleTime } from "d3-scale";
import EventEmitter from "eventemitter3";
import { clamp } from "lodash";
import { start } from "repl";

import { bisectCenter } from "../../math/array";
import { Renderer } from "../../renderer";
import { Container } from "../../renderer/display";
import { Graphics } from "../../renderer/graphics";
import { InteractionData } from "../../renderer/interaction/interaction-data";
import { InteractionEvent } from "../../renderer/interaction/interaction-event";
import { Rectangle } from "../../renderer/math";
import { AXIS_HEIGHT } from "../depth-chart";
import { Colors } from "../depth-chart/helpers";
import { AXIS_WIDTH } from "./chart";
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
import { Gesture } from "./zoom/gesture";
import { ZoomTransform } from "./zoom/transform";
import { Zoom } from "./zoom/zoom";

const OVERLAY_OPACITY = 0.05;

type UiColors = Pick<
  Colors,
  | "backgroundSurface"
  | "buyStroke"
  | "sellStroke"
  | "textPrimary"
  | "textSecondary"
>;

function pointer(event: any, resolution: number = 1): [number, number] {
  const node = event.target;
  const rect = node.getBoundingClientRect();

  return [
    resolution * (event.clientX - rect.left - node.clientLeft),
    resolution * (event.clientY - rect.top - node.clientTop),
  ];
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
  private timeScale: ScaleTime<number, number> = scaleTime();
  private priceScale: ScaleLinear<number, number> = scaleLinear();

  /**
   * The current scale.
   */
  private transform: number = 1;

  private horizontalAxis: HorizontalAxis = new HorizontalAxis();
  private verticalAxis: VerticalAxis = new VerticalAxis();
  private startPriceLine: Graphics = new Graphics();
  private verticalAxisSeparator: Graphics = new Graphics();
  private horizontalAxisSeparator: Graphics = new Graphics();

  private lastEvent: InteractionEvent | null = null;

  public zoom: Zoom = new Zoom();
  private gesture = new Gesture(this);
  private originalTransform: number = 1;
  private firstPoint: [number, number] = [0, 0];

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
    this.stage.addChild(this.startPriceLine);
    this.stage.addChild(this.verticalAxisSeparator);
    this.stage.addChild(this.horizontalAxisSeparator);

    //this.stage.interactive = false;
    //this.stage.hitArea = new Rectangle(0, 0, options.width - AXIS_WIDTH, options.height - AXIS_HEIGHT);

    this.stage.on("wheel", (event: InteractionEvent) => {
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

      this.emit("zoom.verticalAxis", this.transform);
    });

    /*
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
        .on("pointerout", this.onPointerOut); */

    this.horizontalAxis.interactive = true;
    this.horizontalAxis.cursor = "ew-resize";
    this.horizontalAxis.hitArea = new Rectangle(
      options.width - 100,
      0,
      100,
      options.height
    );

    this.horizontalAxis.on("wheel", (event: InteractionEvent) => {
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

      this.emit("zoom.horizontalAxis", this.transform);
    });

    this.verticalAxis.interactive = true;
    this.verticalAxis.cursor = "ns-resize";

    this.verticalAxis.hitArea = new Rectangle(
      options.width - 100,
      0,
      100,
      options.height
    );

    this.verticalAxis
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

        this.emit("zoom.verticalAxis", this.transform);
      })
      .on("pointerdown", this.onPointerDown)
      .on("pointermove", this.onPointerMove)
      .on("pointerout", this.onPointerOut);
  }

  public render(): void {
    this.renderer.render(this.stage);
  }

  public update(
    data: { date: Date; price: number }[],
    timeScale: ScaleTime<number, number>,
    priceScale: ScaleLinear<number, number>,
    startPrice: number
  ): void {
    this.data = data;
    this.timeScale = timeScale;
    this.priceScale = priceScale;

    const width = this.renderer.view.width;
    const height = this.renderer.view.height;
    const resolution = this.renderer.resolution;

    //this.stage.hitArea = new Rectangle(0, 0,
    //  this.renderer.screen.width - AXIS_WIDTH,
    //  this.renderer.screen.height - AXIS_HEIGHT)

    this.horizontalAxis.hitArea = new Rectangle(
      0,
      this.renderer.screen.height - AXIS_HEIGHT,
      this.renderer.screen.width - AXIS_WIDTH,
      AXIS_HEIGHT
    );

    this.horizontalAxis.update(
      this.timeScale,
      width,
      height,
      resolution,
      this.colors
    );

    this.verticalAxis.hitArea = new Rectangle(
      this.renderer.screen.width - AXIS_WIDTH,
      0,
      AXIS_WIDTH,
      this.renderer.screen.height - AXIS_HEIGHT
    );

    this.verticalAxis.update(
      priceScale,
      width,
      height - resolution * AXIS_HEIGHT,
      resolution,
      this.colors
    );

    this.startPriceLine.clear();

    this.startPriceLine.lineStyle({
      width: 1,
      color: 0x898989,
      lineDash: [3, 6],
    });

    this.startPriceLine.moveTo(0, priceScale(startPrice));
    this.startPriceLine.lineTo(
      resolution * this.renderer.screen.width,
      priceScale(startPrice)
    );
    this.startPriceLine.endFill();

    this.verticalAxisSeparator.clear();

    this.verticalAxisSeparator.lineStyle({
      width: 1,
      color: 0x898989,
    });

    this.verticalAxisSeparator.moveTo(
      resolution * this.renderer.screen.width - resolution * AXIS_WIDTH,
      0
    );
    this.verticalAxisSeparator.lineTo(
      resolution * this.renderer.screen.width - resolution * AXIS_WIDTH,
      resolution * this.renderer.screen.height
    );
    this.verticalAxisSeparator.endFill();

    this.horizontalAxisSeparator.clear();

    this.horizontalAxisSeparator.lineStyle({
      width: 1,
      color: 0x898989,
    });

    this.horizontalAxisSeparator.moveTo(
      0,
      resolution * this.renderer.screen.height - resolution * AXIS_HEIGHT
    );
    this.horizontalAxisSeparator.lineTo(
      resolution * this.renderer.screen.width,
      resolution * this.renderer.screen.height - resolution * AXIS_HEIGHT
    );
    this.horizontalAxisSeparator.endFill();
  }

  public destroy() {
    this.stage.destroy();

    this.renderer.destroy();
  }

  private onPointerDown = (event: InteractionEvent) => {
    const resolution = this.renderer.resolution;
    const p = pointer(event.data?.originalEvent, resolution);

    this.firstPoint = p ?? [0, 0];

    if (event.data?.identifier) {
      this.renderer.context.canvas.setPointerCapture(event.data?.identifier);
    }

    this.gesture.mouse = [p, this.zoom.__zoom.invert(p)];
    this.gesture.start();

    const handleMouseMove = (event: any) => {
      event.preventDefault();

      console.log("move");

      this.gesture.mouse[0] = pointer(event, resolution);

      if (this.gesture.mouse[1]) {
        this.gesture.zoom(
          this.zoom.constrain(
            this.zoom.translate(
              this.zoom.__zoom,
              this.gesture.mouse[0],
              this.gesture.mouse[1]
            ),
            [
              [0, 0],
              [100, 100],
            ],
            this.zoom.translateExtent
          ),
          this.firstPoint!
        );
      }
    };

    const handleMouseUp = (event: any) => {
      event.preventDefault();

      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);

      if (event.data?.identifier) {
        this.renderer.context.canvas.releasePointerCapture(
          event.data?.identifier
        );
      }

      this.gesture.end();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  private onPointerMove = (event: InteractionEvent) => {
    const tempEvent = event.data?.originalEvent as WheelEvent;
    const resolution = this.renderer.resolution;
    const p = pointer(tempEvent, resolution);

    // Do not respond to events triggered by elements 'above' the canvas
    if (tempEvent.target === this.renderer.context.canvas) {
      this.emit("mousemove", p);
    }
  };

  private onPointerOut = (event: InteractionEvent) => {
    this.emit("mouseout");
  };

  private onDoubleClick = (event: InteractionEvent) => {
    this.emit("dblclick");
  };
}
