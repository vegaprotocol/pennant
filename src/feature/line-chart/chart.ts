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
import { Data, Row } from "./line-chart";
import { UI } from "./ui";

export function isDateData(
  array: ReadonlyArray<Row>,
): array is ReadonlyArray<[Date, ...number[]]> {
  return typeof array[0][0] !== "number";
}

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

  private xScale: ScaleLinear | ScaleTime | null = null;
  private xZoom: Zoom = new Zoom();
  private lastXZoomTransform: ZoomTransform = zoomIdentity;

  private _data: Data = { cols: [], rows: [] };
  private priceFormat: (price: number) => string;
  private yAxisTickFormat: string | undefined;
  private xFormat: (x: number) => string;
  private _colors: Colors;

  constructor(options: {
    chartView: HTMLCanvasElement;
    axisView: HTMLCanvasElement;
    resolution: number;
    width: number;
    height: number;
    priceFormat: (price: number) => string;
    yAxisTickFormat?: string;
    xFormat: (x: number) => string;
    colors: Colors;
  }) {
    super();

    this.priceFormat = options.priceFormat;
    this.yAxisTickFormat = options.yAxisTickFormat;
    this.xFormat = options.xFormat;
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
      xFormat: this.xFormat,
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
    this.xZoom.transform(zoomIdentity);

    this.lastPriceZoomTransform = zoomIdentity;
    this.lastXZoomTransform = zoomIdentity;

    this.update();
    this.render();
  }

  public destroy() {
    this.ui.destroy();
  }

  private update() {
    const resolution = this.ui.renderer.resolution;

    this.priceScale.range([this.height - resolution * AXIS_HEIGHT, 0]);
    this.xScale!.range([0, this.width - resolution * AXIS_WIDTH]);
    const xr = this.xZoom.__zoom.rescaleX(this.xScale!) as ScaleTime;

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
      this._data.rows.map((d) => [
        xr(d[0]),
        ...d.slice(1).map((series) => yr(series)),
      ]),
      yr(this._data.rows[0][1]),
      this.height,
    );

    this.ui.colors = this._colors;

    this.ui.update(
      this._data,
      xr,
      this.xFormat,
      yr,
      this.priceFormat,
      this.yAxisTickFormat,
    );
  }

  private onZoomStart = (t: ZoomTransform) => {
    this.lastXZoomTransform = t;
    this.emit("zoomstart");
  };

  private onZoomEnd = () => {
    this.emit("zoomend");
  };

  private onZoom = ({ transform: t }: { transform: ZoomTransform }) => {
    const k = this.xZoom.__zoom.k;
    const x = t.x - this.lastXZoomTransform.x;

    this.xZoom.translateBy(x / k, 0);
    this.lastXZoomTransform = t;

    this.update();
    this.render();
    this.emit("zoom");
  };

  private onMouseMove = (d: any) => this.emit("mousemove", d);
  private onMouseOut = () => this.emit("mouseout");

  private onZoomStartHorizontalAxis = (t: ZoomTransform) => {
    this.lastXZoomTransform = t;
  };

  private onZoomHorizontalAxis = (
    t: ZoomTransform,
    point: [number, number],
  ) => {
    const k = t.k / this.lastXZoomTransform.k;

    this.xZoom.scaleBy(k, [point[0], 0]);

    this.lastXZoomTransform = t;

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
      const priceExtent = extent(
        data.rows.flatMap((d) => d.slice(1) as number[]),
      ) as [number, number];

      const adjustment = Math.abs(priceExtent[1] - priceExtent[0]) / 10;

      const xExtent = [data.rows[0][0], data.rows[data.rows.length - 1][0]];

      // FIXME: Only makes sense for time
      if (xExtent[0] === xExtent[1]) {
        xExtent[0] = addHours(xExtent[0], -1);
        xExtent[1] = addHours(xExtent[1], 1);
      }

      this.priceScale = this.priceScale.domain([
        priceExtent[0] - adjustment,
        priceExtent[1] + adjustment,
      ]);

      this.xScale = isDateData(data.rows) ? scaleTime() : scaleLinear();

      this.xScale.domain(xExtent);

      this.priceScale.range([0, this.height - resolution * AXIS_HEIGHT]);
      this.xScale.range([0, this.width - resolution * AXIS_WIDTH]);

      this.xZoom.extent = [
        [0, 0],
        [this.width - resolution * AXIS_WIDTH, this.height],
      ];

      this.xZoom.scaleExtent = [1, 10];

      this.xZoom.translateExtent = [
        [this.xScale(data.rows[0][0]), -Infinity],
        [this.xScale(data.rows[data.rows.length - 1][0]), Infinity],
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
