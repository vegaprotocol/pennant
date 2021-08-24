import { extent, max, min } from "d3-array";
import { ScaleLinear, scaleLinear } from "d3-scale";
import { zoomIdentity } from "d3-zoom";
import EventEmitter from "eventemitter3";

import { Y_AXIS_WIDTH } from "../../constants";
import { ZoomScale, ZoomTransform } from "../../helpers/zoom/transform";
import { Zoom } from "../../helpers/zoom/zoom";
import { Contents } from "./contents";
import { Ui } from "./ui";

export const volumeFormatter = new Intl.NumberFormat("en-gb", {
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

export class Chart extends EventEmitter {
  private contents: Contents;
  private ui: Ui;

  private timeScale: ScaleLinear<number, number> = scaleLinear<
    number,
    number
  >().domain([0, 100]);

  private priceScale: ScaleLinear<number, number> = scaleLinear<
    number,
    number
  >().domain([0, 100]);

  private timeZoom: Zoom = new Zoom();
  private priceZoom: Zoom = new Zoom();

  private isPinned: boolean = true;
  private isFreePan: boolean = false;

  private lastZoomTransform: ZoomTransform = zoomIdentity;

  constructor(options: {
    chartView: HTMLCanvasElement;
    axisView: HTMLCanvasElement;
    resolution: number;
    width: number;
    height: number;
    priceFormat: (price: number) => string;
  }) {
    super();

    this.timeZoom.scaleExtent = [1, 10];
    this.priceZoom.scaleExtent = [1, 10];

    this.contents = new Contents({
      view: options.chartView,
      resolution: options.resolution,
      width: options.width,
      height: options.height,
    });

    this.ui = new Ui({
      view: options.axisView,
      resolution: options.resolution,
      width: options.width,
      height: options.height,
    });

    this.ui
      .on("zoomstart", () => {
        this.emit("zoomstart");
      })
      .on(
        "zoom",
        ({
          transform,
          point,
        }: {
          transform: ZoomTransform;
          point: [number, number];
        }) => {
          const k = transform.k / this.lastZoomTransform.k;

          if (point[0] > this.timeScale.range()[1] - Y_AXIS_WIDTH) {
            if (k === 1) {
              // Pure translation

              this.priceZoom.scaleBy(
                Math.pow(
                  2,
                  -(transform.y - this.lastZoomTransform.y) /
                    1 /
                    (this.priceScale.range()[1] - this.priceScale.range()[0])
                ),
                [
                  0,
                  (this.priceScale.range()[1] - this.priceScale.range()[0]) / 2,
                ]
              );
            } else {
              this.priceZoom.scaleBy(k, [
                0,
                (this.priceScale.range()[1] - this.priceScale.range()[0]) / 2,
              ]);
            }
          } else {
            if (k === 1) {
              // Pure translation

              this.timeZoom.translateBy(
                (transform.x - this.lastZoomTransform.x) /
                  this.timeZoom.__zoom.k,
                0
              );
            } else {
              this.timeZoom.scaleBy(k, point);
            }
          }

          this.lastZoomTransform = transform;

          this.update();
          this.render();
          this.emit("zoom");
        }
      )
      .on("zoomend", () => {
        console.log("zoomend");
        this.emit("zoomend");
      });
  }

  public render() {
    this.contents.render();
    this.ui.render();
  }

  public resize(width: number, height: number) {
    this.contents.renderer.resize(width, height);
    this.ui.renderer.resize(width, height);

    this.timeScale.range([0, this.width]);
    this.priceScale.range([0, this.height]);

    this.update();
  }

  public destroy() {
    this.ui.destroy();
  }

  private update() {
    const resolution = this.ui.renderer.resolution;

    const rescaledTimeScale = this.timeZoom.__zoom.rescaleX(this.timeScale);
    const rescaledPriceScale = this.priceZoom.__zoom.rescaleY(this.priceScale);

    this.contents.update(
      rescaledTimeScale as any,
      rescaledPriceScale as any,
      this.ui.renderer.width,
      this.ui.renderer.height
    );

    this.ui.update(
      rescaledTimeScale as any,
      rescaledPriceScale as any,
      this.ui.renderer.width,
      this.ui.renderer.height
    );
  }

  get height(): number {
    return this.contents.renderer.view.height;
  }

  get width(): number {
    return this.contents.renderer.view.width;
  }
}
