import { extent } from "d3-array";
import { scaleLinear, scaleTime } from "d3-scale";
import { zoomIdentity } from "d3-zoom";
import { addHours } from "date-fns";
import EventEmitter from "eventemitter3";

import { ScaleTime } from "../../types";
import { Contents } from "./contents";
import { Colors } from "./helpers";
import { UI } from "./ui";
import { ZoomTransform } from "./zoom/transform";
import { Zoom } from "./zoom/zoom";

/**
 * Standard font size in CSS pixels
 */
export const FONT_SIZE = 12;

/**
 * Height of the bottom date axis
 */
export const AXIS_HEIGHT = FONT_SIZE + 5;

/**
 * Width of the vertical price axis
 */
export const AXIS_WIDTH = FONT_SIZE + 60;

export class Chart extends EventEmitter {
  private contents: Contents;
  private ui: UI;

  private timeScale: ScaleTime = scaleTime();
  private timeZoom: Zoom = new Zoom();
  private lastTimeZoomTransform: ZoomTransform = zoomIdentity;
  private _priceSpan: number = 1;
  private initialSpan: number = 1;

  private _data: {
    cols: ReadonlyArray<string>;
    rows: ReadonlyArray<[Date, ...number[]]>;
  } = { cols: [], rows: [] };

  private _colors: Colors;

  constructor(options: {
    chartView: HTMLCanvasElement;
    axisView: HTMLCanvasElement;
    resolution: number;
    width: number;
    height: number;
    priceFormat: (price: number) => string;
    volumeFormat: (volume: number) => string;
    colors: Colors;
  }) {
    super();

    this._colors = options.colors;

    this.contents = new Contents({
      view: options.chartView,
      resolution: options.resolution,
      width: options.width,
      height: options.height,
      colors: options.colors,
    });

    this.ui = new UI({
      view: options.axisView,
      resolution: options.resolution,
      width: options.width,
      height: options.height,
      colors: options.colors,
    });

    this.ui
      .on("zoomstart", () => {
        this.emit("zoomstart");
      })
      .on("zoom", ({ transform: t }: { transform: ZoomTransform }) => {
        this.timeZoom.translateBy(
          (t.x - this.lastTimeZoomTransform.x) / this.timeZoom.__zoom.k,
          0
        );

        this.lastTimeZoomTransform = t;

        this.update();
        this.render();
        this.emit("zoom");
      })
      .on("zoomend", () => {
        this.emit("zoomend");
      })
      .on("mousemove", (d) => this.emit("mousemove", d))
      .on("mouseout", () => this.emit("mouseout"));

    this.ui.on("zoom.horizontalAxis", (t: ZoomTransform, point) => {
      const k = t.k / this.lastTimeZoomTransform.k;

      this.timeZoom.scaleBy(k, [
        this.width - this.ui.renderer.resolution * AXIS_WIDTH,
        0,
      ]);

      this.lastTimeZoomTransform = t;

      this.update();
      this.render();
    });

    this.ui.on("zoom.verticalAxis", (t: ZoomTransform) => {
      this._priceSpan = this.initialSpan * t.k;
      this.update();
      this.render();
    });
  }

  public render() {
    this.contents.render();
    this.ui.render();
  }

  public resize(width: number, height: number) {
    this.contents.renderer.resize(width, height);
    this.ui.renderer.resize(width, height);
  }

  public reset() {
    this._priceSpan = 1;
    this.timeZoom.transform(zoomIdentity);

    this.update();
    this.render();
  }

  public destroy() {
    this.ui.destroy();
  }

  private update() {
    const resolution = this.ui.renderer.resolution;

    this.timeScale.range([0, this.width - resolution * AXIS_WIDTH]);

    const xr = this.timeZoom.__zoom.rescaleX(this.timeScale) as ScaleTime;

    const priceExtent = extent(this._data.rows.flatMap((d) => d.slice(1))) as [
      number,
      number
    ];

    if (priceExtent[0] === priceExtent[1]) {
      priceExtent[0] = 0.9 * priceExtent[0];
      priceExtent[1] = 1.1 * priceExtent[1];
    }

    const adjustment = Math.abs(priceExtent[1] - priceExtent[0]) / 10;
    const midPrice = (priceExtent[1] + priceExtent[0]) / 2;

    const priceScale = scaleLinear()
      .domain([
        midPrice + this._priceSpan * (priceExtent[0] - midPrice - adjustment),
        midPrice + this._priceSpan * (priceExtent[1] - midPrice + adjustment),
      ])
      .range([this.height - resolution * AXIS_HEIGHT, 0]);

    this.contents.colors = this._colors;

    this.contents.update(
      priceScale,
      this.timeScale,
      this._data.rows.map((d) => [
        xr(d[0]),
        ...d.slice(1).map((series) => priceScale(series)),
      ]),
      priceScale(this._data.rows[0][1]),
      this.height
    );

    this.ui.colors = this._colors;

    this.ui.update(this._data, xr, priceScale, this._data.rows[0][1]);
  }

  set colors(colors: Colors) {
    this._colors = colors;

    this.update();
    this.render();
  }

  get data() {
    return this._data;
  }

  set data(data: {
    cols: ReadonlyArray<string>;
    rows: ReadonlyArray<[Date, ...number[]]>;
  }) {
    if (data.rows.length === 1) {
      this._data = { cols: data.cols, rows: [data.rows[0], data.rows[0]] };
    } else {
      this._data = data;
    }

    if (data.rows.length > 0) {
      const timeExtent = [data.rows[0][0], data.rows[data.rows.length - 1][0]];

      if (timeExtent[0] === timeExtent[1]) {
        timeExtent[0] = addHours(timeExtent[0], -1);
        timeExtent[1] = addHours(timeExtent[1], 1);
      }

      this.timeScale = this.timeScale.domain(timeExtent);

      const resolution = this.ui.renderer.resolution;

      this.timeScale.range([0, this.width - resolution * AXIS_WIDTH]);

      /*       this.timeZoom.extent = [
        [0, 0],
        [this.width / resolution, this.height],
      ]; */

      /*       this.timeZoom.translateExtent = [
        [this.timeScale(data.rows[0][0]), -Infinity],
        [this.timeScale(data.rows[data.rows.length - 1][0]), Infinity],
      ]; */
    }

    this.update();
    this.render();
  }

  get height(): number {
    return this.contents.renderer.view.height;
  }

  get width(): number {
    return this.contents.renderer.view.width;
  }
}
