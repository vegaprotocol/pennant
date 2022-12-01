import { ScaleLinear, scaleLinear, ScaleTime, scaleTime } from "d3-scale";
import EventEmitter from "eventemitter3";

import { Renderer } from "../../renderer";
import { Container } from "../../renderer/display";
import { Graphics } from "../../renderer/graphics";
import { InteractionEvent } from "../../renderer/interaction/interaction-event";
import { Rectangle } from "../../renderer/math";
import { AXIS_HEIGHT } from "../depth-chart";
import { Colors } from "../depth-chart/helpers";
import { AXIS_WIDTH } from "./chart";
import { HorizontalAxis, VerticalAxis } from "./display-objects";
import { Gesture } from "./zoom/gesture";
import { zoomIdentity, ZoomTransform } from "./zoom/transform";
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

  private timeScale: ScaleTime<number, number> = scaleTime();
  private timeZoom: Zoom = new Zoom();
  private lastTimeZoomTransform: ZoomTransform = zoomIdentity;

  /**
   * The current scale.
   */
  private transform: number = 1;

  private horizontalAxis: HorizontalAxis;
  private verticalAxis: VerticalAxis;
  private startPriceLine: Graphics = new Graphics();
  private verticalAxisSeparator: Graphics = new Graphics();
  private horizontalAxisSeparator: Graphics = new Graphics();

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

    this.horizontalAxis.interactive = true;
    this.horizontalAxis.cursor = "ew-resize";
    this.horizontalAxis.hitArea = new Rectangle(
      options.width - 100,
      0,
      100,
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
            0,
            Math.abs(this.timeScale.range()[1] - this.timeScale.range()[0]) / 2,
          ]
        );
      } else {
        this.timeZoom.scaleBy(k, [
          0,
          (this.timeScale.range()[1] - this.timeScale.range()[0]) / 2,
        ]);
      }

      this.lastTimeZoomTransform = transform;

      this.emit("zoom.horizontalAxis", this.timeZoom.__zoom);
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
}
