import { AXIS_HEIGHT, AXIS_WIDTH } from "@util/constants";
import { ScaleLinear, ScaleTime } from "@util/types";
import { extent } from "d3-array";
import { scaleLinear, scaleTime } from "d3-scale";
import { zoomIdentity } from "d3-zoom";
import { addHours } from "date-fns";
import EventEmitter from "eventemitter3";

import { Zoom, ZoomTransform } from "../../util/zoom";
import { Contents } from "./contents";
import { Colors } from "./helpers";
import { Data } from "./price-chart";
import { UI } from "./ui";

/**
 * Price chart class. Its main roles are to manage interactivity, e.g. zooming and panning
 * as well as requesting contents and ui to update and render.
 */
export class Chart extends EventEmitter {
  private contents: Contents;
  private ui: UI;

  private priceScale: ScaleLinear = scaleLinear();
  private priceZoom: Zoom = new Zoom();
  private lastPriceZoomTransform: ZoomTransform = zoomIdentity;

  private timeScale: ScaleTime = scaleTime();
  private timeZoom: Zoom = new Zoom();
  private lastTimeZoomTransform: ZoomTransform = zoomIdentity;

  private _data: Data = { cols: ["col1", "col2"], rows: [] };
  private priceFormat: (price: number) => string;
  private _colors: Colors;

  constructor(options: {
    chartView: HTMLCanvasElement;
    axisView: HTMLCanvasElement;
    resolution: number;
    width: number;
    height: number;
    priceFormat: (price: number) => string;
    colors: Colors;
  }) {
    super();

    this.priceFormat = options.priceFormat;
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
      priceFormat: this.priceFormat,
    });

    this.ui
      .on("zoomstart", this.onZoomStart)
      .on("zoom", this.onZoom)
      .on("zoomend", this.onZoomEnd)
      .on("mousemove", this.onMouseMove)
      .on("mouseout", this.onMouseOut)
      .on("zoomstart.horizontalAxis", this.onZoomStartHorizontalAxis)
      .on("zoom.horizontalAxis", this.onZoomHorizontalAxis)
      .on("zoom.verticalAxis", this.onZoomVerticalAxis)
      .on("reset", () => this.reset());
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
    this.priceZoom.transform(zoomIdentity);
    this.timeZoom.transform(zoomIdentity);

    this.lastPriceZoomTransform = zoomIdentity;
    this.lastTimeZoomTransform = zoomIdentity;

    this.update();
    this.render();
  }

  public destroy() {
    this.ui.destroy();
  }

  private update() {
    const resolution = this.ui.renderer.resolution;

    this.priceScale.range([this.height - resolution * AXIS_HEIGHT, 0]);
    this.timeScale.range([0, this.width - resolution * AXIS_WIDTH]);
    const xr = this.timeZoom.__zoom.rescaleX(this.timeScale) as ScaleTime;

    const priceExtent = extent(this._data.rows.flatMap((d) => d.slice(1))) as [
      number,
      number,
    ];

    if (priceExtent[0] === priceExtent[1]) {
      priceExtent[0] = 0.9 * priceExtent[0];
      priceExtent[1] = 1.1 * priceExtent[1];
    }

    const yr = this.priceZoom.__zoom.rescaleX(this.priceScale) as ScaleLinear;

    this.contents.colors = this._colors;

    this.contents.update(
      yr,
      xr,
      this._data.rows.map((d) => [xr(d[0]), yr(d[1])]),
      yr(this._data.rows[0][1]),
      this.height,
    );

    this.ui.colors = this._colors;

    this.ui.update(this._data, xr, yr, this._data.rows[0][1], this.priceFormat);
  }

  private onZoomStart = (t: ZoomTransform) => {
    this.lastTimeZoomTransform = t;
    this.emit("zoomstart");
  };

  private onZoomEnd = () => {
    this.emit("zoomend");
  };

  private onZoom = ({ transform: t }: { transform: ZoomTransform }) => {
    const k = this.timeZoom.__zoom.k;
    const x = t.x - this.lastTimeZoomTransform.x;

    this.timeZoom.translateBy(x / k, 0);
    this.lastTimeZoomTransform = t;

    this.update();
    this.render();
    this.emit("zoom");
  };

  private onMouseMove = (d: any) => this.emit("mousemove", d);
  private onMouseOut = () => this.emit("mouseout");

  private onZoomStartHorizontalAxis = (t: ZoomTransform) => {
    this.lastTimeZoomTransform = t;
  };

  private onZoomHorizontalAxis = (
    t: ZoomTransform,
    point: [number, number],
  ) => {
    const k = t.k / this.lastTimeZoomTransform.k;

    this.timeZoom.scaleBy(k, [point[0], 0]);

    this.lastTimeZoomTransform = t;

    this.update();
    this.render();
  };

  private onZoomVerticalAxis = (t: ZoomTransform) => {
    const k = t.k / this.lastPriceZoomTransform.k;

    this.priceZoom.scaleBy(k, [
      (this.height - this.ui.renderer.resolution * AXIS_HEIGHT) / 2,
      0,
    ]);

    this.lastPriceZoomTransform = t;

    this.update();
    this.render();
  };

  set colors(colors: Colors) {
    this._colors = colors;

    this.update();
    this.render();
  }

  get data() {
    return this._data;
  }

  set data(data: Data) {
    if (data.rows.length === 1) {
      this._data = { cols: data.cols, rows: [data.rows[0], data.rows[0]] };
    } else {
      this._data = data;
    }

    const resolution = this.ui.renderer.resolution;

    if (data.rows.length > 0) {
      const priceExtent = extent(data.rows.flatMap((d) => d.slice(1))) as [
        number,
        number,
      ];

      const adjustment = Math.abs(priceExtent[1] - priceExtent[0]) / 10;
      const timeExtent = [data.rows[0][0], data.rows[data.rows.length - 1][0]];

      if (timeExtent[0] === timeExtent[1]) {
        timeExtent[0] = addHours(timeExtent[0], -1);
        timeExtent[1] = addHours(timeExtent[1], 1);
      }

      this.priceScale = this.priceScale.domain([
        priceExtent[0] - adjustment,
        priceExtent[1] + adjustment,
      ]);
      this.timeScale = this.timeScale.domain(timeExtent);

      this.priceScale.range([0, this.height - resolution * AXIS_HEIGHT]);
      this.timeScale.range([0, this.width - resolution * AXIS_WIDTH]);

      this.timeZoom.extent = [
        [0, 0],
        [this.width - resolution * AXIS_WIDTH, this.height],
      ];

      this.timeZoom.scaleExtent = [1, 10];

      this.timeZoom.translateExtent = [
        [this.timeScale(data.rows[0][0]), -Infinity],
        [this.timeScale(data.rows[data.rows.length - 1][0]), Infinity],
      ];
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

  set interactive(interactive: boolean) {
    this.ui.interactive = interactive;
  }
}
