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
import { ScaleLinear, ScaleTime } from "@util/types";
import { scaleLinear, scaleTime } from "d3-scale";
import { format } from "date-fns";
import EventEmitter from "eventemitter3";
import { range } from "lodash";

import { bisectCenter } from "../../util/math/array";
import { Gesture, Zoom, zoomIdentity, ZoomTransform } from "../../util/zoom";
import { Colors } from "./helpers";
import { Data } from "./price-chart";

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
  private data: Data = { cols: ["col1", "col2"], rows: [] };
  private lastPriceZoomTransform: ZoomTransform = zoomIdentity;
  private lastTimeZoomTransform: ZoomTransform = zoomIdentity;
  private priceScale: ScaleLinear = scaleLinear();
  private priceZoom: Zoom = new Zoom();
  private startPrice: number = 0;
  private timeScale: ScaleTime = scaleTime();
  private timeZoom: Zoom = new Zoom();
  private firstPoint: [number, number] | null = null;
  private gesture = new Gesture(this);
  private isZooming = false;
  private lastEvent: InteractionEvent | null = null;

  // Display objects
  private horizontalAxis: HorizontalAxis;
  private verticalAxis: VerticalAxis;
  private startPriceLine: Graphics = new Graphics();
  private verticalAxisSeparator: Graphics = new Graphics();
  private horizontalAxisSeparator: Graphics = new Graphics();
  private crosshair: Crosshair = new Crosshair(1, 0x888888, [3, 3]);

  private indicator: Indicator[] = range(0, 6).map(
    () => new Indicator(0xff0000),
  );

  private priceLabel: Label = new Label();
  private timeLabel: Label = new Label();
  private startPriceLabel: Label = new Label();
  private hitBox: Container = new Container();

  private priceFormat: (price: number) => string;

  constructor(options: {
    view: HTMLCanvasElement;
    resolution: number;
    width: number;
    height: number;
    colors: UiColors;
    priceFormat: (price: number) => string;
  }) {
    super();

    this.renderer = new Renderer({
      view: options.view,
      resolution: options.resolution,
      width: options.width,
      height: options.height,
    });

    this.priceFormat = options.priceFormat;

    this.colors = options.colors;
    this.horizontalAxis = new HorizontalAxis(this.renderer);
    this.verticalAxis = new VerticalAxis(this.renderer);

    this.stage.addChild(this.horizontalAxis);
    this.stage.addChild(this.verticalAxis);
    this.stage.addChild(this.startPriceLine);
    this.stage.addChild(this.verticalAxisSeparator);
    this.stage.addChild(this.horizontalAxisSeparator);
    this.stage.addChild(this.crosshair);
    this.stage.addChild(...this.indicator);
    this.stage.addChild(this.startPriceLabel);
    this.stage.addChild(this.priceLabel);
    this.stage.addChild(this.timeLabel);
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
    data: Data,
    timeScale: ScaleTime,
    priceScale: ScaleLinear,
    startPrice: number,
    priceFormat: (price: number) => string,
  ): void {
    this.data = data;
    this.timeScale = timeScale;
    this.priceScale = priceScale;
    this.startPrice = startPrice;
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
      this.timeScale,
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

    // TODO: Abstract the start price line functionality
    this.startPriceLine.clear();

    this.startPriceLine.lineStyle({
      width: 2,
      color: this.colors.textPrimary,
      lineDash: [6, 3],
    });

    this.startPriceLine.moveTo(0, priceScale(startPrice));

    this.startPriceLine.lineTo(
      resolution * this.renderer.screen.width,
      priceScale(startPrice),
    );

    this.startPriceLine.endFill();

    if (this.data.cols.length > 2) {
      this.startPriceLine.visible = false;
      this.startPriceLabel.visible = false;
    } else {
      this.startPriceLine.visible = true;
      this.startPriceLabel.visible = true;
    }

    const numTicks = height / resolution / 50;
    const tickFormat = this.priceScale.tickFormat(numTicks);

    this.startPriceLabel.update(
      priceFormat(startPrice),
      resolution * this.renderer.screen.width - resolution * 7,
      priceScale(startPrice),
      { x: 1, y: 0.5 },
      resolution,
      {
        backgroundSurface: this.colors.emphasis200,
        textPrimary: this.colors.textPrimary,
      },
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
      const k = transform.k / this.lastTimeZoomTransform.k;

      if (k === 1) {
        this.timeZoom.scaleBy(
          Math.pow(
            2,
            -(transform.x - this.lastTimeZoomTransform.x) /
              1 /
              (this.timeScale.range()[1] - this.timeScale.range()[0]),
          ),
          [
            Math.abs(this.timeScale.range()[1] - this.timeScale.range()[0]) / 2,
            0,
          ],
        );
      } else {
        this.timeZoom.scaleBy(k, [
          (this.timeScale.range()[1] - this.timeScale.range()[0]) / 2,
          0,
        ]);
      }

      this.lastTimeZoomTransform = transform;
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
    this.timeLabel.visible = true;

    for (let index = 0; index < this.indicator.length; index++) {
      if (index + 1 < this.data.cols.length) {
        this.indicator[index].visible = true;
      }
    }

    let x = event.data?.global.x;
    let y = event.data?.global.y;

    if (x && y && this.data.rows.length > 1) {
      const resolution = this.renderer.resolution;
      x *= resolution;

      const width = this.renderer.view.width;
      const height = this.renderer.view.height;

      const index = bisectCenter(
        this.data.rows.map((d) => this.timeScale(d[0])),
        x,
      );

      const nearestX = this.data.rows[index];

      this.crosshair.update(
        this.timeScale(nearestX[0]),
        resolution * y,
        width,
        height,
        resolution,
      );

      for (let i = 0; i < this.indicator.length; i++) {
        if (i + 1 < this.data.cols.length) {
          this.indicator[i].update(
            this.timeScale(nearestX[0]),
            this.priceScale(nearestX[i + 1]),
            this.data.cols.length === 2
              ? (nearestX[i + 1] as number) > this.startPrice
                ? this.colors.positiveStroke
                : this.colors.negativeStroke
              : (this.colors as any)[`accent${i + 1}`],
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

      this.timeLabel.update(
        format(nearestX[0], "dd/MM/yyyy HH:mm a"),
        this.timeScale(nearestX[0]),
        height - (resolution * AXIS_HEIGHT) / 2,
        { x: 0.5, y: 0.5 },
        resolution,
        { ...this.colors, backgroundSurface: this.colors.emphasis100 },
      );

      this.render();

      // TODO: This is just a hack to see what this looks like
      if (!this.isZooming) {
        const arg = {
          index,
          point: [this.timeScale(nearestX[0]) / resolution, y],
          value: nearestX[0],
          series: range(0, this.data.cols.length - 1).map((i) => ({
            color:
              this.data.cols.length === 2
                ? (nearestX[i + 1] as number) > this.startPrice
                  ? hex2string(this.colors.positiveStroke)
                  : hex2string(this.colors.negativeStroke)
                : hex2string((this.colors as any)[`accent${i + 1}`]),
            name: this.data.cols[i + 1],
            value: this.priceFormat(nearestX[i + 1] as number),
          })),
        };

        this.emit("mousemove", arg);
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
    const k = transform.k / this.lastTimeZoomTransform.k;

    if (k === 1) {
      this.timeZoom.scaleBy(
        Math.pow(
          2,
          -(transform.x - this.lastTimeZoomTransform.x) /
            (this.timeScale.range()[1] - this.timeScale.range()[0]),
        ),
        [
          Math.abs(this.timeScale.range()[1] - this.timeScale.range()[0]) / 2,
          0,
        ],
      );
    } else {
      this.timeZoom.scaleBy(k, [
        (this.timeScale.range()[1] - this.timeScale.range()[0]) / 2,
        0,
      ]);
    }

    this.lastTimeZoomTransform = transform;
    this.emit("zoom.horizontalAxis", this.timeZoom.__zoom, point);
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
    this.timeLabel.visible = false;

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
