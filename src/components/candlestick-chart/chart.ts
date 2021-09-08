import { extent, max, min } from "d3-array";
import { ScaleLinear, scaleLinear } from "d3-scale";
import { zoomIdentity } from "d3-zoom";
import EventEmitter from "eventemitter3";

import { Y_AXIS_WIDTH } from "../../constants";
import { ZoomScale, ZoomTransform } from "../../helpers/zoom/transform";
import { Zoom } from "../../helpers/zoom/zoom";
import { Disposable } from "../banderole/disposable";
import styles from "./candlestick-chart.module.css";
import { Contents } from "./contents";
import { Ui } from "./ui";

export interface PaneOptions {
  closable?: boolean;
}

export class Pane extends EventEmitter implements Disposable {
  private contents: Contents;
  private ui: Ui;

  private resizeObserver: ResizeObserver;

  private closeable: boolean;

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

          if (false && point[0] > this.timeScale.range()[1] - Y_AXIS_WIDTH) {
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

              this._timeZoom.translateBy(
                (transform.x - this.lastZoomTransform.x) /
                  this._timeZoom.__zoom.k,
                0
              );
            } else {
              this._timeZoom.scaleBy(k, point);
            }
          }

          this.lastZoomTransform = transform;

          //this.update();
          //this.render();
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

    this.closeable = options?.closable ?? false;
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
    this.priceScale.range([0, this.height]);

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

export class PaneItem {
  public pane: Pane;

  constructor(pane: Pane) {
    this.pane = pane;
  }
}

export class Chart extends EventEmitter {
  private timeScale: ScaleLinear<number, number> = scaleLinear<
    number,
    number
  >().domain([0, 100]);

  private timeZoom: Zoom = new Zoom();

  private lastZoomTransform: ZoomTransform = zoomIdentity;

  private paneItems: PaneItem[] = [];

  constructor() {
    super();

    this.timeZoom.scaleExtent = [1, 10];
  }

  public addPane(pane: Pane) {
    pane
      .on("zoomstart", (_event) => {
        console.log("zoomstart");
      })
      .on("zoom", (transform) => {
        this.timeZoom.__zoom = transform;

        this.paneItems.forEach((paneItem) => {
          paneItem.pane.timeZoom = this.timeZoom;
        });
      })
      .on("zoomend", (_event) => {
        console.log("zoomend");
      });

    pane.update();
    pane.render();

    this.paneItems.push(new PaneItem(pane));
  }

  public removePane(index: number): void {
    this.paneItems.splice(index, 1);
  }
}
