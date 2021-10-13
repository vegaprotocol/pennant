import { extent } from "d3-array";
import { ScaleTime, scaleTime } from "d3-scale";
import EventEmitter from "eventemitter3";

import { Zoom } from "../../helpers/zoom/zoom";
import { bisectCenter } from "../../math/array";
import { studyInfoFields } from "../pane-view/helpers";
import { LineCurve } from "./display-objects";
import { Disposable } from "./disposable";
import { Pane } from "./pane";
import { TimeAxis } from "./time-axis";

export class PaneItem {
  public pane: Pane;

  constructor(pane: Pane) {
    this.pane = pane;
  }
}

/**
 * Reponsible for drawing a candlestick chart
 */
export class Chart extends EventEmitter implements Disposable {
  private resizeObserver: ResizeObserver;

  private paneItems: PaneItem[] = [];
  private timeAxis: TimeAxis;

  private timeZoom: Zoom = new Zoom();
  private timeScale: ScaleTime<number, number> = scaleTime<
    number,
    number
  >().domain([0, 100]);

  private _data: (Record<string, number> & { date: Date })[] = [];
  private dates: Date[] = [];

  constructor(options: {
    container: HTMLElement;
    timeAxis: HTMLElement;
    resolution: number;
  }) {
    super();

    this.resizeObserver = new ResizeObserver((entries) => {
      const devicePixelRatio = window.devicePixelRatio;

      for (let entry of entries) {
        if (entry.devicePixelContentBoxSize) {
          const devicePixelContentBoxSize = entry.devicePixelContentBoxSize[0];

          this.resize(
            devicePixelContentBoxSize.inlineSize,
            devicePixelContentBoxSize.blockSize
          );
          this.render();
        } else if (entry.contentBoxSize) {
          // Firefox implements `contentBoxSize` as a single content rect, rather than an array
          const contentBoxSize = Array.isArray(entry.contentBoxSize)
            ? entry.contentBoxSize[0]
            : entry.contentBoxSize;

          this.resize(contentBoxSize.inlineSize, contentBoxSize.blockSize);
          this.render();
        }
      }
    });

    this.resizeObserver.observe(options.container);

    this.timeAxis = new TimeAxis({
      container: options.timeAxis,
      resolution: options.resolution,
    });

    this.timeAxis
      .on("zoomstart", (_event) => {})
      .on("zoom", (transform) => {
        this.timeZoom.__zoom = transform;

        this.paneItems.forEach((paneItem) => {
          paneItem.pane.timeZoom = this.timeZoom;
        });

        this.timeAxis.timeZoom = this.timeZoom;

        this.update();
        this.render();
      })
      .on("zoomend", (_event) => {});

    this.timeAxis.update();
    this.timeAxis.render();

    this.timeZoom.scaleExtent = [0.1, 10];
  }

  get data() {
    return this._data;
  }

  set data(data: any[]) {
    this._data = data;

    this.dates = data.map((d) => d.date);

    const dateExtent = extent(this.dates);

    if (dateExtent[0]) {
      // FIXME: This is wrong, should only be set once on construction
      this.timeScale.domain(dateExtent);
    }

    this.update();
    this.render();
  }

  public addPane(pane: Pane) {
    pane
      .on("mousemove", (point: [number, number]) => {
        const xm = this.timeScale.invert(point[0]);
        const dates = this.dates;

        const index = bisectCenter(dates, xm);

        this.paneItems.forEach((paneItem) => {
          paneItem.pane.crosshair = [this.timeScale(dates[index]), null];
        });

        pane.crosshair = [this.timeScale(dates[index]), point[1]];

        this.emit("mousemove", index);
      })
      .on("mouseout", (event) => {
        this.emit("mousemove", null);

        this.paneItems.forEach((paneItem) => {
          paneItem.pane.crosshair = [null, null];
        });
      })
      .on("zoomstart", (_event) => {})
      .on("zoom", (transform) => {
        this.timeZoom.__zoom = transform;

        this.paneItems.forEach((paneItem) => {
          paneItem.pane.timeZoom = this.timeZoom;
        });

        this.timeAxis.timeZoom = this.timeZoom;

        this.update();
        this.render();
      })
      .on("zoomend", (_event) => {});

    pane.update();
    pane.render();

    this.paneItems.push(new PaneItem(pane));
  }

  public dispose() {
    this.resizeObserver.disconnect();
  }

  public removePane(index: number): void {
    this.paneItems.splice(index, 1);
  }

  public render() {
    for (const item of this.paneItems) {
      item.pane.render();
    }

    this.timeAxis.render();
  }

  public resize(width: number, height: number) {
    this.timeScale.range([0, width]);
    this.update();
    this.render();
  }

  public update() {
    const rescaledTimeScale: ScaleTime<number, number> =
      this.timeZoom.__zoom.rescaleX(this.timeScale) as any;

    for (const item of this.paneItems) {
      item.pane.timeScale = rescaledTimeScale;
      item.pane.update();
    }

    this.timeAxis.timeScale = rescaledTimeScale;
    this.timeAxis.update();
  }
}
