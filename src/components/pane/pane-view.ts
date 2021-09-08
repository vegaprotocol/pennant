import { ScaleLinear, scaleLinear } from "d3-scale";
import { zoomIdentity } from "d3-zoom";
import EventEmitter from "eventemitter3";

import { Y_AXIS_WIDTH } from "../../constants";
import { ZoomTransform } from "../../helpers/zoom/transform";
import { Zoom } from "../../helpers/zoom/zoom";
import { Disposable } from "../banderole/disposable";
import styles from "../candlestick-chart/candlestick-chart.module.css";
import { Contents } from "../candlestick-chart/contents";
import { Ui } from "../candlestick-chart/ui";

export const volumeFormatter = new Intl.NumberFormat("en-gb", {
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

export class PaneView extends EventEmitter implements Disposable {
  private container: HTMLElement;
  private contentsCanvas: HTMLCanvasElement | null = null;
  private uiCanvas: HTMLCanvasElement | null = null;

  private contents: Contents;
  private ui: Ui;

  private resizeObserver: ResizeObserver;

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

  constructor(
    container: HTMLDivElement,
    options: {
      resolution: number;
      width: number;
      height: number;
      priceFormat: (price: number) => string;
    }
  ) {
    super();

    this.timeZoom.scaleExtent = [1, 10];
    this.priceZoom.scaleExtent = [1, 10];

    this.container = container;
    this.contentsCanvas = document.createElement("canvas");
    this.uiCanvas = document.createElement("canvas");

    this.container.classList.add(styles.canvasContainer);
    this.contentsCanvas.classList.add(styles.canvas);
    this.uiCanvas.classList.add(styles.canvas);

    this.container.prepend(this.uiCanvas);
    this.container.prepend(this.contentsCanvas);

    this.resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentBoxSize) {
          // Firefox implements `contentBoxSize` as a single content rect, rather than an array
          const contentBoxSize = Array.isArray(entry.contentBoxSize)
            ? entry.contentBoxSize[0]
            : entry.contentBoxSize;

          this.resize(contentBoxSize.inlineSize, contentBoxSize.blockSize);
          this.render();
        }
      }
    });

    this.resizeObserver.observe(this.container);

    this.contents = new Contents({
      view: this.contentsCanvas,
      resolution: options.resolution,
      width: options.width,
      height: options.height,
    });

    this.ui = new Ui({
      view: this.uiCanvas,
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
    this.ui.dispose();
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

  public dispose() {
    if (this.resizeObserver) {
      this.resizeObserver.unobserve(this.container);
    }

    if (this.contentsCanvas) {
      this.container.removeChild(this.contentsCanvas);
      this.contentsCanvas = null;
    }

    if (this.uiCanvas) {
      this.container.removeChild(this.uiCanvas);
      this.uiCanvas = null;
    }
  }
}
