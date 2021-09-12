import { ScaleLinear, scaleLinear } from "d3-scale";
import EventEmitter from "eventemitter3";

import { Y_AXIS_WIDTH } from "../../constants";
import { zoomIdentity, ZoomTransform } from "../../helpers/zoom/transform";
import { Zoom } from "../../helpers/zoom/zoom";
import { Contents } from "./contents";
import { Disposable } from "./disposable";
import styles from "./pane.module.css";
import { TimeAxisUi } from "./time-axis-ui";
import { Ui } from "./ui";

export interface PaneOptions {
  closable?: boolean;
}

/**
 * Reponsible for drawing a candlestick chart time axis.
 */
export class TimeAxis extends EventEmitter implements Disposable {
  private ui: TimeAxisUi;
  private resizeObserver: ResizeObserver;

  private timeScale: ScaleLinear<number, number> = scaleLinear<
    number,
    number
  >().domain([0, 100]);

  private _timeZoom: Zoom = new Zoom();
  private lastZoomTransform: ZoomTransform = zoomIdentity;

  constructor(container: HTMLElement, options: PaneOptions = {}) {
    super();

    const ui = document.createElement("canvas");
    ui.classList.add(styles.canvas);

    this.ui = new TimeAxisUi({
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

          if (k === 1) {
            this._timeZoom.scaleBy(
              Math.pow(
                2,
                -(transform.x - this.lastZoomTransform.x) /
                  1 /
                  (this.timeScale.range()[1] - this.timeScale.range()[0])
              ),
              [this.timeScale.range()[1] - Y_AXIS_WIDTH, 0]
            );
          } else {
            this._timeZoom.scaleBy(k, [
              this.timeScale.range()[1] - Y_AXIS_WIDTH,
              0,
            ]);
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

    wrapper.appendChild(ui);

    container.prepend(wrapper);
  }

  get height(): number {
    return this.ui.renderer.view.height;
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
    return this.ui.renderer.view.width;
  }

  public dispose() {
    this.ui.dispose();
  }

  public render() {
    this.ui.render();
  }

  public resize(width: number, height: number) {
    this.ui.renderer.resize(width, height);
    this.timeScale.range([0, this.width]);
    this.update();
  }

  public update() {
    const resolution = this.ui.renderer.resolution;

    const rescaledTimeScale = this.timeZoom.__zoom.rescaleX(this.timeScale);

    this.ui.update(
      rescaledTimeScale as any,
      this.ui.renderer.width,
      this.ui.renderer.height
    );
  }
}
