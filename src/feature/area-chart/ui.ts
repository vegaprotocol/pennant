import {
  Crosshair,
  HorizontalAxis,
  Indicator,
  Label,
  pointer,
  VerticalAxis,
} from "@ui/display-objects";
import {
  Container,
  Graphics,
  hex2string,
  InteractionEvent,
  Rectangle,
  Renderer,
} from "@ui/renderer";
import { AXIS_HEIGHT, AXIS_WIDTH } from "@util/constants";
import { isDate } from "@util/misc";
import { ScaleLinear, ScaleTime } from "@util/types";
import { scaleLinear, scaleTime } from "d3-scale";
import { format } from "date-fns";
import EventEmitter from "eventemitter3";
import { range } from "lodash";

import { bisectCenter } from "../../util/math/array";
import { Gesture, Zoom, zoomIdentity, ZoomTransform } from "../../util/zoom";
import { SeriesData } from "./chart";
import { Colors } from "./helpers";

type UiColors = Pick<
  Colors,
  | "accent1"
  | "accent2"
  | "accent3"
  | "accent4"
  | "accent5"
  | "accent6"
  | "backgroundSurface"
  | "positiveStroke"
  | "emphasis100"
  | "emphasis200"
  | "negativeStroke"
  | "textPrimary"
  | "textSecondary"
>;

/**
 * Reponsible for drawing axes and handling interactivity for depth chart
 */
export class UI extends EventEmitter {
  public colors: UiColors;
  public renderer: Renderer;

  /**
   * The scale extent to the specified array of numbers [k0, k1] where k0 is the minimum allowed scale factor
   * and k1 is the maximum allowed scale factor.
   */
  public scaleExtent = [0, Infinity];
  public stage: Container = new Container();
  public zoom: Zoom = new Zoom();

  private _interactive = true;
  private data: SeriesData = [];
  private lastPriceZoomTransform: ZoomTransform = zoomIdentity;
  private lastXZoomTransform: ZoomTransform = zoomIdentity;
  private priceScale: ScaleLinear = scaleLinear();
  private priceZoom: Zoom = new Zoom();
  private xScale: ScaleLinear | ScaleTime | null = null;
  private xZoom: Zoom = new Zoom();
  private firstPoint: [number, number] | null = null;
  private gesture = new Gesture(this);
  private isZooming = false;
  private lastEvent: InteractionEvent | null = null;

  // Display objects
  private horizontalAxis: HorizontalAxis;
  private verticalAxis: VerticalAxis;
  private verticalAxisSeparator: Graphics = new Graphics();
  private horizontalAxisSeparator: Graphics = new Graphics();
  private crosshair: Crosshair = new Crosshair(1, 0x888888, [3, 3]);

  private indicator: Indicator[] = range(0, 6).map(
    () => new Indicator(0xff0000),
  );

  private priceLabel: Label = new Label();
  private xLabel: Label = new Label();
  private hitBox: Container = new Container();

  private priceFormat: (price: number) => string;
  private xFormat: (x: number) => string;

  constructor(options: {
    view: HTMLCanvasElement;
    resolution: number;
    width: number;
    height: number;
    colors: UiColors;
    priceFormat: (price: number) => string;
    xFormat: (x: number) => string;
  }) {
    super();

    this.renderer = new Renderer({
      view: options.view,
      resolution: options.resolution,
      width: options.width,
      height: options.height,
    });

    this.priceFormat = options.priceFormat;
    this.xFormat = options.xFormat;

    this.colors = options.colors;
    this.horizontalAxis = new HorizontalAxis(this.renderer);
    this.verticalAxis = new VerticalAxis(this.renderer);

    this.stage.addChild(this.horizontalAxis);
    this.stage.addChild(this.verticalAxis);
    this.stage.addChild(this.verticalAxisSeparator);
    this.stage.addChild(this.horizontalAxisSeparator);
    this.stage.addChild(this.crosshair);
    this.stage.addChild(...this.indicator);
    this.stage.addChild(this.priceLabel);
    this.stage.addChild(this.xLabel);
    this.stage.addChild(this.hitBox);

    this.hitBox.interactive = true;
    this.hitBox.cursor = "default";
    this.hitBox.hitArea = new Rectangle(0, 0, 300, 300);
    this.hitBox
      .on("wheel", this.onWheel)
      .on("pointerdown", this.onPointerDown)
      .on("pointermove", this.onPointerMove)
      .on("pointerout", this.onPointerOut);

    this.horizontalAxis.interactive = true;
    this.horizontalAxis.cursor = "ew-resize";
    this.horizontalAxis.hitArea = new Rectangle(
      options.width - AXIS_WIDTH,
      0,
      AXIS_WIDTH,
      options.height,
    );

    this.horizontalAxis
      .on("zoomstart", this.onZoomStartHorizontalAxis)
      .on("zoom", this.onZoomHorizontalAxis)
      .on("dblclick", () => this.emit("reset"));

    this.verticalAxis.interactive = true;
    this.verticalAxis.cursor = "ns-resize";

    this.verticalAxis.hitArea = new Rectangle(
      options.width - 100,
      0,
      100,
      options.height,
    );

    this.verticalAxis
      .on("zoom", this.onZoomVerticalAxis)
      .on("dblclick", () => this.emit("reset"));
  }

  public render(): void {
    this.renderer.render(this.stage);
  }

  public update(
    data: SeriesData,
    xScale: ScaleLinear | ScaleTime,
    xFormat: (x: number) => string,
    priceScale: ScaleLinear,
    priceFormat: (price: number) => string,
  ): void {
    this.data = data;
    this.xScale = xScale;
    this.xFormat = xFormat;
    this.priceScale = priceScale;
    this.priceFormat = priceFormat;

    const width = this.renderer.view.width;
    const height = this.renderer.view.height;
    const resolution = this.renderer.resolution;

    this.hitBox.hitArea = new Rectangle(
      0,
      0,
      this.renderer.screen.width - AXIS_WIDTH,
      this.renderer.screen.height - AXIS_HEIGHT,
    );

    this.horizontalAxis.hitArea = new Rectangle(
      0,
      this.renderer.screen.height - AXIS_HEIGHT,
      this.renderer.screen.width - AXIS_WIDTH,
      AXIS_HEIGHT,
    );

    this.horizontalAxis.update(
      this.xScale,
      width,
      height,
      resolution,
      this.colors,
    );

    this.verticalAxis.hitArea = new Rectangle(
      this.renderer.screen.width - AXIS_WIDTH,
      0,
      AXIS_WIDTH,
      this.renderer.screen.height - AXIS_HEIGHT,
    );

    this.verticalAxis.update(
      priceScale,
      width,
      height - resolution * AXIS_HEIGHT,
      resolution,
      this.colors,
    );

    // TODO: Abstract the vertical axis separator functionality
    this.verticalAxisSeparator.clear();

    this.verticalAxisSeparator.lineStyle({
      width: 1,
      color: this.colors.emphasis200,
    });

    this.verticalAxisSeparator.moveTo(
      resolution * this.renderer.screen.width - resolution * AXIS_WIDTH,
      0,
    );

    this.verticalAxisSeparator.lineTo(
      resolution * this.renderer.screen.width - resolution * AXIS_WIDTH,
      resolution * this.renderer.screen.height,
    );

    this.verticalAxisSeparator.endFill();

    // TODO: Abstract the horizontal axis separator functionality
    this.horizontalAxisSeparator.clear();

    this.horizontalAxisSeparator.lineStyle({
      width: 1,
      color: this.colors.emphasis200,
    });

    this.horizontalAxisSeparator.moveTo(
      0,
      resolution * this.renderer.screen.height - resolution * AXIS_HEIGHT,
    );

    this.horizontalAxisSeparator.lineTo(
      resolution * this.renderer.screen.width,
      resolution * this.renderer.screen.height - resolution * AXIS_HEIGHT,
    );

    this.horizontalAxisSeparator.endFill();
  }

  public destroy() {
    this.stage.destroy();
    this.renderer.destroy();
  }

  private onWheel = (event: InteractionEvent) => {
    if (this._interactive) {
      const tempEvent = event.data?.originalEvent as WheelEvent;
      const resolution = this.renderer.resolution;
      const p = pointer(tempEvent, resolution);

      this.isZooming = true;
      this.hideTooltips();
      this.emit("mouseout");

      if (this.gesture.wheel) {
        window.clearTimeout(this.gesture.wheel);
      } else {
        this.gesture.mouse = [p, p];
        this.gesture.start(this.zoom.__zoom);
      }

      this.gesture.wheel = window.setTimeout(() => {
        this.isZooming = false;

        if (this.lastEvent) {
          this.onPointerMove(this.lastEvent);
        }

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

      const transform = this.zoom.__zoom;
      const k = transform.k / this.lastXZoomTransform.k;

      if (k === 1) {
        this.xZoom.scaleBy(
          Math.pow(
            2,
            -(transform.x - this.lastXZoomTransform.x) /
              1 /
              (this.xScale!.range()[1] - this.xScale!.range()[0]),
          ),
          [Math.abs(this.xScale!.range()[1] - this.xScale!.range()[0]) / 2, 0],
        );
      } else {
        this.xZoom.scaleBy(k, [
          (this.xScale!.range()[1] - this.xScale!.range()[0]) / 2,
          0,
        ]);
      }

      this.lastXZoomTransform = transform;
      this.emit("zoom.horizontalAxis", this.zoom.__zoom, p);
    }
  };

  private onPointerDown = (event: InteractionEvent) => {
    if (this._interactive) {
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
      this.isZooming = true;
      this.hideTooltips();
      this.emit("mouseout");
      this.hitBox.cursor = "grabbing";
      this.render();

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

        this.hitBox.cursor = "default";

        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);

        if (event.data?.identifier) {
          this.renderer.context.canvas.releasePointerCapture(
            event.data?.identifier,
          );
        }

        this.gesture.end();
        this.isZooming = false;

        if (this.lastEvent) {
          this.onPointerMove(this.lastEvent);
        }
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
  };

  private onPointerMove = (event: InteractionEvent) => {
    if ("ontouchstart" in self) return;

    this.crosshair.visible = true;
    this.priceLabel.visible = true;
    this.xLabel.visible = true;

    for (let index = 0; index < this.indicator.length; index++) {
      if (index < this.data.length) {
        this.indicator[index].visible = true;
      }
    }

    let x = event.data?.global.x;
    let y = event.data?.global.y;

    if (x && y && this.data[0].length > 1) {
      const resolution = this.renderer.resolution;
      x *= resolution;

      const width = this.renderer.view.width;
      const height = this.renderer.view.height;

      const index = bisectCenter(
        this.data[0].i.map((d) => this.xScale!(d)),
        x,
      );

      const nearestX = this.data[0].i[index];

      this.crosshair.update(
        this.xScale!(nearestX),
        resolution * y,
        width,
        height,
        resolution,
      );

      for (let i = 0; i < this.indicator.length; i++) {
        if (i < this.data.length) {
          this.indicator[i].update(
            this.xScale!(nearestX),
            this.priceScale(this.data[i][index][1]),
            (this.colors as any)[`accent${i + 1}`],
          );
        } else {
          this.indicator[i].visible = false;
        }
      }

      this.priceLabel.update(
        this.priceFormat(this.priceScale.invert(resolution * y)),
        width - resolution * 7,
        resolution * y,
        { x: 1, y: 0.5 },
        resolution,
        { ...this.colors, backgroundSurface: this.colors.emphasis100 },
      );

      this.xLabel.update(
        isDate(nearestX)
          ? format(nearestX, "dd/MM/yyyy HH:mm a")
          : this.xFormat(nearestX),
        this.xScale!(nearestX),
        height - (resolution * AXIS_HEIGHT) / 2,
        { x: 0.5, y: 0.5 },
        resolution,
        { ...this.colors, backgroundSurface: this.colors.emphasis100 },
      );

      this.render();

      // TODO: This is just a hack to see what this looks like
      if (!this.isZooming) {
        this.emit("mousemove", {
          index,
          point: [this.xScale!(nearestX) / resolution, y],
          value: nearestX,
          series: range(0, this.data.length).map((i) => ({
            color: hex2string((this.colors as any)[`accent${i + 1}`]),
            name: this.data[i].key,
            value: this.priceFormat(
              this.data[i][index].data[this.data[i].key] as number,
            ),
          })),
        });
      } else {
        this.onPointerOut();
      }

      this.lastEvent = event;
    }
  };

  private onZoomStartHorizontalAxis = (transform: ZoomTransform) => {
    this.emit("zoomstart.horizontalAxis", transform);
  };

  private onZoomHorizontalAxis = ({
    transform,
    point,
  }: {
    transform: ZoomTransform;
    point: [number, number];
  }) => {
    const k = transform.k / this.lastXZoomTransform.k;

    if (k === 1) {
      this.xZoom.scaleBy(
        Math.pow(
          2,
          -(transform.x - this.lastXZoomTransform.x) /
            (this.xScale!.range()[1] - this.xScale!.range()[0]),
        ),
        [Math.abs(this.xScale!.range()[1] - this.xScale!.range()[0]) / 2, 0],
      );
    } else {
      this.xZoom.scaleBy(k, [
        (this.xScale!.range()[1] - this.xScale!.range()[0]) / 2,
        0,
      ]);
    }

    this.lastXZoomTransform = transform;
    this.emit("zoom.horizontalAxis", this.xZoom.__zoom, point);
  };

  private onZoomVerticalAxis = ({
    transform,
    point,
  }: {
    transform: ZoomTransform;
    point: [number, number];
  }) => {
    const k = transform.k / this.lastPriceZoomTransform.k;

    if (k === 1) {
      this.priceZoom.scaleBy(
        Math.pow(
          2,
          -(transform.y - this.lastPriceZoomTransform.y) /
            1 /
            (this.priceScale.range()[1] - this.priceScale.range()[0]),
        ),
        [
          0,
          Math.abs(this.priceScale.range()[1] - this.priceScale.range()[0]) / 2,
        ],
      );
    } else {
      this.priceZoom.scaleBy(k, [
        0,
        (this.priceScale.range()[1] - this.priceScale.range()[0]) / 2,
      ]);
    }

    this.lastPriceZoomTransform = transform;
    this.emit("zoom.verticalAxis", this.priceZoom.__zoom, point);
  };

  private hideTooltips = () => {
    this.crosshair.visible = false;
    this.priceLabel.visible = false;
    this.xLabel.visible = false;

    for (let i = 0; i < this.indicator.length; i++) {
      this.indicator[i].visible = false;
    }
  };

  private onPointerOut = () => {
    this.hideTooltips();
    this.emit("mouseout");
    this.lastEvent = null;
    this.render();
  };

  set interactive(interactive: boolean) {
    this._interactive = interactive;
    this.horizontalAxis.interactive = interactive;
    this.verticalAxis.interactive = interactive;
  }
}
