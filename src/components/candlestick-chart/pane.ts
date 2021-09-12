import { ScaleLinear, scaleLinear } from "d3-scale";
import EventEmitter from "eventemitter3";

import { Y_AXIS_WIDTH } from "../../constants";
import { zoomIdentity, ZoomTransform } from "../../helpers/zoom/transform";
import { Zoom } from "../../helpers/zoom/zoom";
import { Contents } from "./contents";
import { Disposable } from "./disposable";
import styles from "./pane.module.css";
import { Ui } from "./ui";

export interface PaneOptions {
  closable?: boolean;
}

/**
 * Reponsible for drawing a candlestick chart pane.
 */
export class Pane extends EventEmitter implements Disposable {
  private contents: Contents;
  private ui: Ui;
  private resizeObserver: ResizeObserver;
  private isClosable: boolean;
  private isFreePan = false;
  private isPinned = true;

  private timeScale: ScaleLinear<number, number> = scaleLinear<
    number,
    number
  >().domain([0, 100]);

  private priceScale: ScaleLinear<number, number> = scaleLinear<
    number,
    number
  >().domain([0, 100]);

  private _timeZoom: Zoom = new Zoom();
  private priceZoom: Zoom = new Zoom();
  private lastZoomTransform: ZoomTransform = zoomIdentity;

  constructor(container: HTMLElement, options: PaneOptions = {}) {
    super();

    const contents = document.createElement("canvas");
    contents.classList.add(styles.canvas);

    this.priceZoom.scaleExtent = [0.1, 10];

    this.contents = new Contents({
      view: contents,
      resolution: 1,
      width: 300,
      height: 300,
    });

    const ui = document.createElement("canvas");
    ui.classList.add(styles.canvas);

    this.ui = new Ui({
      view: ui,
      resolution: 1,
      width: 300,
      height: 300,
    })
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
            this.isFreePan = true;

            if (k === 1) {
              this.priceZoom.scaleBy(
                Math.pow(
                  2,
                  -(transform.y - this.lastZoomTransform.y) /
                    1 /
                    (this.priceScale.range()[1] - this.priceScale.range()[0])
                ),
                [
                  0,
                  Math.abs(
                    this.priceScale.range()[1] - this.priceScale.range()[0]
                  ) / 2,
                ]
              );
            } else {
              this.priceZoom.scaleBy(k, [
                0,
                Math.abs(
                  this.priceScale.range()[1] - this.priceScale.range()[0]
                ) / 2,
              ]);
            }
          } else {
            if (k === 1) {
              this.isPinned = false;

              this._timeZoom.translateBy(
                (transform.x - this.lastZoomTransform.x) /
                  this._timeZoom.__zoom.k,
                0
              );

              if (this.isFreePan) {
                this.priceZoom.translateBy(
                  0,
                  (transform.y - this.lastZoomTransform.y) /
                    this.priceZoom.__zoom.k
                );
              }
            } else {
              this._timeZoom.scaleBy(k, [
                this.isPinned
                  ? this.timeScale.range()[1] - Y_AXIS_WIDTH
                  : point[0],
                0,
              ]);
            }
          }

          this.lastZoomTransform = transform;

          this.emit("zoom", this._timeZoom.__zoom);
        }
      )
      .on("zoomend", () => {
        this.emit("zoomend");
      });

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

    this.resizeObserver.observe(container);

    this.ui.render();

    const wrapper = document.createElement("div");
    wrapper.classList.add(styles.canvasContainer);

    wrapper.appendChild(contents);
    wrapper.appendChild(ui);

    container.prepend(wrapper);

    this.isClosable = options?.closable ?? false;
  }

  get height(): number {
    return this.contents.renderer.view.height;
  }

  get timeZoom() {
    return this._timeZoom;
  }

  set timeZoom(zoom) {
    this._timeZoom = zoom;
    this.update();
    this.render();
  }

  get width(): number {
    return this.contents.renderer.view.width;
  }

  public dispose() {
    this.contents.dispose();
    this.ui.dispose();
  }

  public render() {
    this.contents.render();
    this.ui.render();
  }

  public resize(width: number, height: number) {
    this.contents.renderer.resize(width, height);
    this.ui.renderer.resize(width, height);

    this.timeScale.range([0, this.width]);
    this.priceScale.range([this.height, 0]);

    this.update();
  }

  public update() {
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
}
