import { bisectLeft, bisectRight, zip } from "d3-array";
import { Delaunay } from "d3-delaunay";
import { ScaleLinear, scaleLinear } from "d3-scale";
import { zoomIdentity } from "d3-zoom";
import EventEmitter from "eventemitter3";
import { clamp } from "lodash";

import { Gesture } from "../../helpers/zoom/gesture";
import { Inertia } from "../../helpers/zoom/inertia";
import { ZoomTransform } from "../../helpers/zoom/transform";
import { Zoom } from "../../helpers/zoom/zoom";
import { bisectCenter } from "../../math/array";
import { Renderer } from "../../renderer";
import { Container } from "../../renderer/display";
import { InteractionData } from "../../renderer/interaction/interaction-data";
import { InteractionEvent } from "../../renderer/interaction/interaction-event";
import { Rectangle } from "../../renderer/math";
import { Rect } from "../depth-chart/display-objects";
import { YAxis } from "./display-objects/y-axis";

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
export class Ui extends EventEmitter {
  public stage: Container = new Container();
  public renderer: Renderer;

  public yAxis: YAxis = new YAxis();

  /**
   * The scale extent to the specified array of numbers [k0, k1] where k0 is the minimum allowed scale factor
   * and k1 is the maximum allowed scale factor.
   */
  public scaleExtent = [0, Infinity];

  public zoom: Zoom = new Zoom();
  public inertia: Inertia = new Inertia();

  private lastEvent: InteractionEvent | null = null;

  // TODO: Shouldn't need this but was seeing issues where a closed over variable was being mutated
  private firstPoint: [number, number] | null = null;

  private gesture = new Gesture(this);
  private originalTransform: ZoomTransform = zoomIdentity;

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

    this.stage.interactive = true;
    this.stage.hitArea = new Rectangle(0, 0, options.width, options.height);

    this.yAxis.interactive = true;
    this.yAxis.cursor = "grab";

    this.stage.addChild(this.yAxis);

    this.stage
      .on("wheel", this.onWheel)
      .on("touchstart", this.onTouchStart)
      .on("touchmove", this.onTouchMove)
      .on("touchend", this.onTouchEnd)
      .on("pointerdown", this.onPointerDown)
      .on("pointermove", this.onPointerMove)
      .on("pointerout", this.onPointerOut);
  }

  public render(): void {
    this.renderer.render(this.stage);
  }

  public update(
    timeScale: ScaleLinear<number, number>,
    priceScale: ScaleLinear<number, number>,
    width: number,
    height: number
  ): void {
    const resolution = this.renderer.resolution;

    this.stage.hitArea = new Rectangle(
      0,
      0,
      this.renderer.screen.width,
      this.renderer.screen.height
    );

    this.yAxis.update(priceScale, width, height, resolution);
  }

  private onTouchStart = (event: InteractionEvent) => {
    if (event.data?.originalEvent instanceof TouchEvent) {
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
        this.originalTransform = this.zoom.__zoom;
        this.gesture.start();
      }
    }
  };

  private onTouchMove = (event: InteractionEvent) => {
    if (event.data?.originalEvent instanceof TouchEvent) {
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

        this.zoom.scaleTo(this.originalTransform.k * k, [0, 0]);

        this.gesture.zoom(this.zoom.__zoom, [0, 0]);
      }
    }
  };

  private onTouchEnd = (event: InteractionEvent) => {
    if (event.data?.originalEvent instanceof TouchEvent) {
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
  };

  private onWheel = (event: InteractionEvent) => {
    const tempEvent = event.data?.originalEvent as WheelEvent;

    const resolution = this.renderer.resolution;

    const p = pointer(tempEvent, resolution);

    if (this.gesture.wheel) {
      window.clearTimeout(this.gesture.wheel);
    } else {
      this.gesture.mouse = [p, p];
      this.gesture.start();
    }

    this.gesture.wheel = window.setTimeout(() => {
      this.gesture.wheel = null;
      this.gesture.end();
    }, 150);

    this.zoom.wheeled(
      -tempEvent.deltaY * 0.002 * (tempEvent.ctrlKey ? 10 : 1),
      this.gesture.mouse[0] ?? [0, 0],
      [
        [0, 0],
        [100, 100],
      ]
    );

    this.emit("zoom", { transform: this.zoom.__zoom, point: p });
  };

  private onPointerDown = (event: InteractionEvent) => {
    const resolution = this.renderer.resolution;
    const p = pointer(event.data?.originalEvent, resolution);

    this.firstPoint = p ?? [0, 0];

    let previousT = 0;

    const handleRender = (t: number) => {
      this.zoom.translateBy(
        ((t - previousT) * this.inertia.velocity[0]) / 30,
        ((t - previousT) * this.inertia.velocity[1]) / 30
      );

      this.gesture.zoom(this.zoom.__zoom, this.firstPoint!);

      previousT = t;
    };

    this.inertia.on("render", handleRender);
    this.inertia.on("start", () => {
      previousT = 0;
    });

    this.inertia.start(p);

    this.gesture.mouse = [p, this.zoom.__zoom.invert(p)];
    this.gesture.start();

    const handleMouseMove = (event: any) => {
      event.preventDefault();

      this.gesture.mouse[0] = pointer(event, resolution);

      this.inertia.move(this.gesture.mouse[0]);

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

      this.gesture.end();
      this.inertia.end();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  private onPointerMove = (event: InteractionEvent) => {};

  private onPointerOut = (event: InteractionEvent) => {};

  public destroy() {
    this.stage.destroy();

    this.renderer.destroy();
  }
}
