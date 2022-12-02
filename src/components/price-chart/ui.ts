import { ScaleLinear, scaleLinear, scaleTime } from "d3-scale";
import { format } from "date-fns";
import EventEmitter from "eventemitter3";

import { bisectCenter } from "../../math/array";
import { Renderer } from "../../renderer";
import { Container } from "../../renderer/display";
import { Graphics } from "../../renderer/graphics";
import { InteractionEvent } from "../../renderer/interaction/interaction-event";
import { Rectangle } from "../../renderer/math";
import { ScaleTime } from "../../types";
import { AXIS_HEIGHT } from "../depth-chart";
import { AXIS_WIDTH } from "./chart";
import {
  Crosshair,
  HorizontalAxis,
  Indicator,
  Label,
  VerticalAxis,
} from "./display-objects";
import { Colors } from "./helpers";
import { Gesture } from "./zoom/gesture";
import { zoomIdentity, ZoomTransform } from "./zoom/transform";
import { Zoom } from "./zoom/zoom";

type UiColors = Pick<
  Colors,
  | "backgroundSurface"
  | "buyStroke"
  | "emphasis100"
  | "emphasis200"
  | "sellStroke"
  | "textPrimary"
  | "textSecondary"
>;

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
  private priceZoom: Zoom = new Zoom();
  private lastPriceZoomTransform: ZoomTransform = zoomIdentity;

  private timeScale: ScaleTime = scaleTime();
  private timeZoom: Zoom = new Zoom();
  private lastTimeZoomTransform: ZoomTransform = zoomIdentity;

  /**
   * The current scale.
   */
  private transform: number = 1;

  private startPrice: number = 0;

  private horizontalAxis: HorizontalAxis;
  private verticalAxis: VerticalAxis;
  private startPriceLine: Graphics = new Graphics();
  private verticalAxisSeparator: Graphics = new Graphics();
  private horizontalAxisSeparator: Graphics = new Graphics();
  private crosshair: Crosshair = new Crosshair(1, 0x888888, [3, 3]);
  private indicator: Indicator = new Indicator(0xff0000);
  private priceLabel: Label = new Label();
  private timeLabel: Label = new Label();
  private startPriceLabel: Label = new Label();
  private hitBox: Container = new Container();

  private lastEvent: InteractionEvent | null = null;

  public zoom: Zoom = new Zoom();

  private gesture = new Gesture(this);

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

    this.horizontalAxis = new HorizontalAxis(this.renderer);
    this.verticalAxis = new VerticalAxis(this.renderer);

    this.stage.addChild(this.horizontalAxis);
    this.stage.addChild(this.verticalAxis);
    this.stage.addChild(this.startPriceLine);
    this.stage.addChild(this.verticalAxisSeparator);
    this.stage.addChild(this.horizontalAxisSeparator);
    this.stage.addChild(this.crosshair);
    this.stage.addChild(this.indicator);
    this.stage.addChild(this.startPriceLabel);
    this.stage.addChild(this.priceLabel);
    this.stage.addChild(this.timeLabel);
    this.stage.addChild(this.hitBox);

    this.hitBox.interactive = true;
    this.hitBox.cursor = "default";
    this.hitBox.hitArea = new Rectangle(0, 0, 300, 300);
    this.hitBox
      .on("pointermove", this.onPointerMove)
      .on("pointerout", this.onPointerOut);

    this.horizontalAxis.interactive = true;
    this.horizontalAxis.cursor = "ew-resize";
    this.horizontalAxis.hitArea = new Rectangle(
      options.width - AXIS_WIDTH,
      0,
      AXIS_WIDTH,
      options.height
    );

    this.horizontalAxis.on("zoom", ({ transform, point }) => {
      const k = transform.k / this.lastTimeZoomTransform.k;

      if (k === 1) {
        this.timeZoom.scaleBy(
          Math.pow(
            2,
            -(transform.x - this.lastTimeZoomTransform.x) /
              1 /
              (this.timeScale.range()[1] - this.timeScale.range()[0])
          ),
          [
            Math.abs(this.timeScale.range()[1] - this.timeScale.range()[0]) / 2,
            0,
          ]
        );
      } else {
        this.timeZoom.scaleBy(k, [
          (this.timeScale.range()[1] - this.timeScale.range()[0]) / 2,
          0,
        ]);
      }

      this.lastTimeZoomTransform = transform;

      this.emit("zoom.horizontalAxis", this.timeZoom.__zoom, point);
    });

    this.verticalAxis.interactive = true;
    this.verticalAxis.cursor = "ns-resize";

    this.verticalAxis.hitArea = new Rectangle(
      options.width - 100,
      0,
      100,
      options.height
    );

    this.verticalAxis.on("zoom", ({ transform, point }) => {
      const k = transform.k / this.lastPriceZoomTransform.k;

      if (k === 1) {
        this.priceZoom.scaleBy(
          Math.pow(
            2,
            -(transform.y - this.lastPriceZoomTransform.y) /
              1 /
              (this.priceScale.range()[1] - this.priceScale.range()[0])
          ),
          [
            0,
            Math.abs(this.priceScale.range()[1] - this.priceScale.range()[0]) /
              2,
          ]
        );
      } else {
        this.priceZoom.scaleBy(k, [
          0,
          (this.priceScale.range()[1] - this.priceScale.range()[0]) / 2,
        ]);
      }

      this.lastPriceZoomTransform = transform;

      this.emit("zoom.verticalAxis", this.priceZoom.__zoom);
    });
  }

  public render(): void {
    this.renderer.render(this.stage);
  }

  public update(
    data: { date: Date; price: number }[],
    timeScale: ScaleTime,
    priceScale: ScaleLinear<number, number>,
    startPrice: number
  ): void {
    this.data = data;
    this.timeScale = timeScale;
    this.priceScale = priceScale;
    this.startPrice = startPrice;

    const width = this.renderer.view.width;
    const height = this.renderer.view.height;
    const resolution = this.renderer.resolution;

    this.hitBox.hitArea = new Rectangle(
      0,
      0,
      this.renderer.screen.width - AXIS_WIDTH,
      this.renderer.screen.height - AXIS_HEIGHT
    );

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

    const numTicks = height / resolution / 50;
    const tickFormat = this.priceScale.tickFormat(numTicks);

    this.startPriceLabel.update(
      tickFormat(startPrice),
      resolution * this.renderer.screen.width - resolution * 7,
      priceScale(startPrice),
      { x: 1, y: 0.5 },
      resolution,
      {
        backgroundSurface: this.colors.emphasis200,
        textPrimary: this.colors.textPrimary,
      }
    );

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

  private onPointerMove = (event: InteractionEvent) => {
    this.crosshair.visible = true;
    this.indicator.visible = true;
    this.priceLabel.visible = true;
    this.timeLabel.visible = true;

    if ("ontouchstart" in self) return;

    this.lastEvent = event;

    let x = event.data?.global.x;
    let y = event.data?.global.y;

    if (x && y && this.data.length > 1) {
      const resolution = this.renderer.resolution;
      x *= resolution;

      const width = this.renderer.view.width;
      const height = this.renderer.view.height;

      const index = bisectCenter(
        this.data.map((d) => this.timeScale(d.date)),
        x
      );
      const nearestX = this.data[index];

      this.crosshair.update(
        this.timeScale(nearestX.date),
        resolution * y,
        width,
        height,
        resolution
      );

      this.indicator.update(
        this.timeScale(nearestX.date),
        this.priceScale(nearestX.price),
        nearestX.price > this.startPrice
          ? this.colors.buyStroke
          : this.colors.sellStroke
      );

      const numTicks = height / resolution / 50;
      const tickFormat = this.priceScale.tickFormat(numTicks);

      this.priceLabel.update(
        tickFormat(this.priceScale.invert(resolution * y)),
        width - resolution * 7,
        resolution * y,
        { x: 1, y: 0.5 },
        resolution,
        { ...this.colors, backgroundSurface: this.colors.emphasis100 }
      );

      this.timeLabel.update(
        format(nearestX.date, "HH:mm dd MMM yyyy"),
        this.timeScale(nearestX.date),
        height - (resolution * AXIS_HEIGHT) / 2,
        { x: 0.5, y: 0.5 },
        resolution,
        { ...this.colors, backgroundSurface: this.colors.emphasis100 }
      );

      this.render();

      this.emit("mousemove", {
        point: [this.timeScale(nearestX.date) / resolution, y],
        content: {
          date: nearestX.date,
          price: nearestX.price,
        },
      });
    }
  };

  private onPointerOut = () => {
    this.crosshair.visible = false;
    this.indicator.visible = false;
    this.priceLabel.visible = false;
    this.timeLabel.visible = false;

    this.emit("mouseout");

    this.lastEvent = null;

    this.render();
  };
}
