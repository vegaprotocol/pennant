import {
  Container,
  Graphics,
  InteractionEvent,
  Renderer,
  Text,
} from "@ui/renderer";
import { AXIS_WIDTH, FONT_SIZE } from "@util/constants";
import { ScaleLinear } from "@util/types";

import { Colors } from "../../feature/depth-chart/helpers";
import { Gesture, Zoom } from "../../util/zoom";

export function pointer(event: any, resolution: number = 1): [number, number] {
  const node = event.target as HTMLElement;
  const rect = node.getBoundingClientRect();

  return [
    resolution * (event.clientX - rect.left - node.clientLeft),
    resolution * (event.clientY - rect.top - node.clientTop),
  ];
}

type VerticalAxisColors = Pick<
  Colors,
  "backgroundSurface" | "textPrimary" | "textSecondary"
>;

/**
 * Draws a vertical axis at the right of the chart
 */
export class VerticalAxis extends Container {
  public renderer: Renderer;
  public zoom: Zoom = new Zoom();
  private gesture = new Gesture(this);
  private firstPoint: [number, number] = [0, 0];
  private overlay: Graphics = new Graphics();

  /**
   * Cache ticks
   */
  private nodeByKeyValue = new Map<string, Text>();

  constructor(renderer: Renderer) {
    super();

    this.renderer = renderer;

    this.addChild(this.overlay);

    this.on("wheel", this.onWheel)
      .on("pointerdown", this.onPointerDown)
      .on("pointermove", this.onPointerMove)
      .on("pointerout", this.onPointerOut);
  }

  public update(
    scale: ScaleLinear,
    width: number,
    height: number,
    resolution: number = 1,
    colors: VerticalAxisColors,
    tickFormatSpecifier?: string,
  ) {
    this.overlay.clear();
    this.overlay.beginFill(colors.backgroundSurface, 0.7);

    this.overlay.drawRect(
      width - resolution * AXIS_WIDTH,
      0,
      resolution * AXIS_WIDTH,
      height,
    );

    this.overlay.endFill();

    const numTicks = height / resolution / 50;
    const ticks = scale.ticks(numTicks);
    const tickFormat = scale.tickFormat(numTicks, tickFormatSpecifier);

    const enter = ticks.filter(
      (tick) => !this.nodeByKeyValue.has(tickFormat(tick)),
    );

    const update = ticks.filter((tick) =>
      this.nodeByKeyValue.has(tickFormat(tick)),
    );

    const exit = [...this.nodeByKeyValue.keys()].filter(
      (node) => !(ticks.map(tickFormat).indexOf(node) !== -1),
    );

    for (const node of enter) {
      const text = new Text(tickFormat(node), {
        fill: colors.textSecondary,
        fontFamily: "monospace",
        fontSize: FONT_SIZE,
      });

      text.x = width - resolution * 7;
      text.y = scale(node);
      text.anchor.set(1, 0.5);

      text.updateText(); // TODO: Should not need to call this

      this.nodeByKeyValue.set(tickFormat(node), text);
      this.addChild(text);
    }

    for (const node of update) {
      const text = this.nodeByKeyValue.get(tickFormat(node))!;

      text.style.fill = colors.textSecondary;
      text.x = width - resolution * 7;
      text.y = scale(node);
    }

    for (const node of exit) {
      const text = this.nodeByKeyValue.get(node)!;

      this.nodeByKeyValue.delete(node);
      this.removeChild(text);
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
    this.gesture.start();

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

    // Do not respond to events triggered by elements 'above' the canvas
    if (tempEvent.target === this.renderer.context.canvas) {
      this.emit("mousemove", p);
    }
  };

  private onPointerOut = (event: InteractionEvent) => {
    this.emit("mouseout");
  };
}
