import {
  Container,
  Graphics,
  InteractionEvent,
  Renderer,
  Text,
} from "@ui/renderer";
import { AXIS_HEIGHT, FONT_SIZE } from "@util/constants";
import { range } from "@util/misc";
import { ScaleLinear, ScaleTime } from "@util/types";

import { Colors } from "../../feature/depth-chart/helpers";
import { Gesture, Zoom } from "../../util/zoom";
import { pointer } from "./vertical-axis";

const MAX_TICKS = 20;

type HorizontalAxisColors = Pick<
  Colors,
  "backgroundSurface" | "textPrimary" | "textSecondary"
>;

/**
 * Draws a horizontal axis at the bottom of the chart
 */
export class HorizontalAxis extends Container {
  public renderer: Renderer;
  public zoom: Zoom = new Zoom();
  private gesture = new Gesture(this);
  private firstPoint: [number, number] = [0, 0];
  private overlay: Graphics = new Graphics();

  private tickNodes: Text[] = [];

  constructor(renderer: Renderer) {
    super();

    this.renderer = renderer;

    this.addChild(this.overlay);

    this.on("wheel", this.onWheel)
      .on("pointerdown", this.onPointerDown)
      .on("pointermove", this.onPointerMove)
      .on("pointerout", this.onPointerOut);

    // TODO: Dynamically scale (double etc)
    this.tickNodes = range(0, MAX_TICKS).map(
      () =>
        new Text("", {
          fill: 0xffffff,
          fontFamily: "monospace",
          fontSize: FONT_SIZE,
        }),
    );

    for (let i = 0; i < this.tickNodes.length; i++) {
      this.tickNodes[i].visible = false;
      this.addChild(this.tickNodes[i]);
    }
  }

  public update(
    scale: ScaleLinear | ScaleTime,
    width: number,
    height: number,
    resolution: number = 1,
    colors: HorizontalAxisColors,
  ) {
    this.overlay.clear();
    this.overlay.beginFill(colors.backgroundSurface, 0.7);

    this.overlay.drawRect(
      0,
      height - resolution * AXIS_HEIGHT,
      width,
      resolution * AXIS_HEIGHT,
    );

    this.overlay.endFill();

    const numTicks = width / resolution / 200;
    const ticks = scale.ticks(numTicks);
    const tickFormat = scale.tickFormat(numTicks);

    for (let i = 0; i < this.tickNodes.length; i++) {
      this.tickNodes[i].visible = false;
    }

    for (let i = 0; i < Math.min(ticks.length, this.tickNodes.length); i++) {
      const text = this.tickNodes[i];

      text.visible = true;

      text.text = tickFormat(ticks[i] as any);

      text.x = scale(ticks[i]);
      text.y = height - (resolution * AXIS_HEIGHT) / 2;
      text.anchor.set(0.5, 0.5);
      text.style.fill = colors.textSecondary;

      text.updateText(); // TODO: Should not need to call this
    }
  }

  private onWheel = (event: InteractionEvent) => {
    const tempEvent = event.data?.originalEvent as WheelEvent;
    const resolution = this.renderer.resolution;
    const p = pointer(tempEvent, resolution);

    if (this.gesture.wheel) {
      window.clearTimeout(this.gesture.wheel);
    } else {
      this.gesture.mouse = [p, p];
      this.gesture.start(this.zoom.__zoom);
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
      ],
    );

    this.emit("zoom", { transform: this.zoom.__zoom, point: p });
  };

  private onPointerDown = (event: InteractionEvent) => {
    const resolution = this.renderer.resolution;
    const p = pointer(event.data?.originalEvent, resolution);

    this.firstPoint = p ?? [0, 0];

    if (event.data?.identifier) {
      this.renderer.context.canvas.setPointerCapture(event.data?.identifier);
    }

    this.gesture.mouse = [p, this.zoom.__zoom.invert(p)];
    this.gesture.start(
      this.zoom.constrain(
        this.zoom.translate(
          this.zoom.__zoom,
          this.gesture.mouse[0],
          this.gesture.mouse[1],
        ),
        [
          [0, 0],
          [100, 100],
        ],
        this.zoom.translateExtent,
      ),
    );

    const handleMouseMove = (event: any) => {
      event.preventDefault();

      this.gesture.mouse[0] = pointer(event, resolution);

      if (this.gesture.mouse[1]) {
        this.gesture.zoom(
          this.zoom.constrain(
            this.zoom.translate(
              this.zoom.__zoom,
              this.gesture.mouse[0],
              this.gesture.mouse[1],
            ),
            [
              [0, 0],
              [100, 100],
            ],
            this.zoom.translateExtent,
          ),
          this.firstPoint!,
        );
      }
    };

    const handleMouseUp = (event: any) => {
      event.preventDefault();

      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);

      if (event.data?.identifier) {
        this.renderer.context.canvas.releasePointerCapture(
          event.data?.identifier,
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

    // Do not respond to evensts triggered by elements 'above' the canvas
    if (tempEvent.target === this.renderer.context.canvas) {
      this.emit("mousemove", p);
    }
  };

  private onPointerOut = (event: InteractionEvent) => {
    this.emit("mouseout");
  };
}
