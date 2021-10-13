import { extent } from "d3-array";
import { ScaleLinear, scaleLinear, ScaleTime, scaleTime } from "d3-scale";
import EventEmitter from "eventemitter3";

import { Y_AXIS_WIDTH } from "../../constants";
import { zoomIdentity, ZoomTransform } from "../../helpers/zoom/transform";
import { Zoom } from "../../helpers/zoom/zoom";
import { RenderableObject } from "../../renderer/core/renderable-object";
import { UpdatableObject } from "../../renderer/core/updatable-object";
import { DisplayObject } from "../../renderer/display";
import { Contents } from "./contents";
import { Disposable } from "./disposable";
import styles from "./pane.module.css";
import { Ui } from "./ui";

export interface PaneOptions {
  closable?: boolean;
  resolution?: number;
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

  public data: any[] = [];
  public fields: string[] = [];

  private priceScale: ScaleLinear<number, number> = scaleLinear<
    number,
    number
  >().domain([0, 100]);

  private _crosshair: [number | null, number | null] = [null, null];
  private _renderableObjects: (DisplayObject & UpdatableObject)[] = [];
  private _timeZoom: Zoom = new Zoom();
  private priceZoom: Zoom = new Zoom();
  private lastZoomTransform: ZoomTransform = zoomIdentity;

  public timeScale: ScaleTime<number, number> = scaleTime<
    number,
    number
  >().domain([new Date(), new Date()]);

  constructor(container: HTMLElement, options: PaneOptions = {}) {
    super();

    const resolution = options.resolution ?? 1;

    const contents = document.createElement("canvas");
    contents.classList.add(styles.canvas);

    this.priceZoom.scaleExtent = [0.1, 10];

    this.contents = new Contents({
      view: contents,
      resolution: resolution,
      width: 300,
      height: 300,
    });

    const ui = document.createElement("canvas");
    ui.classList.add(styles.canvas);

    this.ui = new Ui({
      view: ui,
      resolution: resolution,
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

          if (
            point[0] >
            this.timeScale.range()[1] - resolution * Y_AXIS_WIDTH
          ) {
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
                  ? this.timeScale.range()[1] - resolution * Y_AXIS_WIDTH
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
      })
      .on("dblclick", () => {
        this.priceZoom.__zoom = zoomIdentity;
        this.emit("zoom", zoomIdentity);
      })
      .on("mousemove", (point: [number, number]) => {
        if (point[0] <= this.timeScale.range()[1] - resolution * Y_AXIS_WIDTH) {
          this.emit("mousemove", point);
        } else {
          this.emit("mousemove", [null, null]);
        }
      })
      .on("mouseout", () => {
        this.emit("mouseout");
      });

    this.resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.devicePixelContentBoxSize) {
          const devicePixelContentBoxSize = entry.devicePixelContentBoxSize[0];

          this.resize(
            devicePixelContentBoxSize.inlineSize / devicePixelRatio,
            devicePixelContentBoxSize.blockSize / devicePixelRatio
          );

          this.render();
        } else if (entry.contentBoxSize) {
          // Firefox implements `contentBoxSize` as a single content rect, rather than an array
          const contentBoxSize = Array.isArray(entry.contentBoxSize)
            ? entry.contentBoxSize[0]
            : entry.contentBoxSize;

          this.resize(
            contentBoxSize.inlineSize / devicePixelRatio,
            contentBoxSize.blockSize / devicePixelRatio
          );
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

  get crosshair() {
    return this._crosshair;
  }

  set crosshair(point) {
    this._crosshair = point;
    this.update();
    this.render();
  }

  get height(): number {
    return this.contents.renderer.view.height;
  }

  set renderableObjects(
    renderableObjects: (DisplayObject & UpdatableObject)[]
  ) {
    this._renderableObjects = renderableObjects;

    for (const object of this.contents.content) {
      //this.contents.stage.removeChild(object);
    }

    this.contents.content = this._renderableObjects;

    for (const object of this.contents.content) {
      this.contents.stage.addChild(object);
    }

    if (this.data.length > 0) {
      const domain = extent(
        this.data.flatMap((d) => this.fields?.map((field) => d[field]))
      ) as [number, number];

      this.priceScale.domain(domain);
    }

    this.update();
    this.render();
  }

  set domain(domain: [number, number]) {
    this.priceScale.domain(domain)
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
    // TODO: Dispose of resizeObserver
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

    this.priceScale.range([this.height, 0]);

    this.update();
  }

  public update() {
    const resolution = this.ui.renderer.resolution;

    const rescaledPriceScale = this.priceZoom.__zoom.rescaleY(this.priceScale);

    this.contents.update(
      this.timeScale,
      rescaledPriceScale as any,
      this.ui.renderer.width,
      this.ui.renderer.height
    );

    this.ui.update(
      this.timeScale,
      rescaledPriceScale as any,
      this.ui.renderer.width,
      this.ui.renderer.height,
      this._crosshair
    );
  }
}
