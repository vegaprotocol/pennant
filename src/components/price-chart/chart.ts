import { extent } from "d3-array";
import { scaleLinear, scaleTime } from "d3-scale";
import EventEmitter from "eventemitter3";

import { Contents } from "./contents";
import { Colors } from "./helpers";
import { UI } from "./ui";
import { ZoomTransform } from "./zoom/transform";

/**
 * Standard font size in CSS pixels
 */
export const FONT_SIZE = 12;

/**
 * Height of the bottom price axis
 */
export const AXIS_HEIGHT = FONT_SIZE + 5;

/**
 * Width of the vertical price axis
 */
export const AXIS_WIDTH = FONT_SIZE + 60;

export class Chart extends EventEmitter {
  private chart: Contents;
  private ui: UI;

  private _timeSpan: number = 1;
  private _priceSpan: number = 1;
  private initialSpan: number = 1;

  private _data: { date: Date; price: number }[] = [];

  private priceFormat: (price: number) => string;
  private volumeFormat: (volume: number) => string;

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

    this.priceFormat = options.priceFormat;
    this.volumeFormat = options.volumeFormat;
    this._colors = options.colors;

    this.chart = new Contents({
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
      .on("zoom", (t: any) => {
        console.log(t.transform.k);
        //this._priceSpan = this.initialSpan / (1 - t.transform.y / 1000);
        this.update();
        this.render();
        this.emit("zoom");
      })
      .on("zoomend", () => {
        this.emit("zoomend");
      })
      .on("mousemove", (d) => this.emit("mousemove", d))
      .on("mouseout", () => this.emit("mouseout"));

    this.ui.on("zoom.horizontalAxis", (t: ZoomTransform) => {
      this._timeSpan = this.initialSpan * t.k;
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
    this.chart.render();
    this.ui.render();
  }

  public resize(width: number, height: number) {
    this.chart.renderer.resize(width, height);
    this.ui.renderer.resize(width, height);
  }

  public reset() {
    this._priceSpan = 1;
    this._timeSpan = 1;

    this.update();
    this.render();
  }

  public destroy() {
    this.ui.destroy();
  }

  private update() {
    const resolution = this.ui.renderer.resolution;

    const timeExtent = extent([
      this._data[0].date,
      this._data[this._data.length - 1].date,
    ]) as [Date, Date];

    const extent1 = new Date(
      timeExtent[0].getTime() +
        this._timeSpan * (timeExtent[1].getTime() - timeExtent[0].getTime())
    );

    const timeScale = scaleTime()
      .domain([timeExtent[0], extent1])
      .range([0, this.width - resolution * AXIS_WIDTH]);

    const priceExtent = extent(this._data.map((d) => d.price)) as [
      number,
      number
    ];

    const adjustment = Math.abs(priceExtent[1] - priceExtent[0]) / 10;
    const midPrice = (priceExtent[1] + priceExtent[0]) / 2;

    const priceScale = scaleLinear()
      .domain([
        midPrice + this._priceSpan * (priceExtent[0] - midPrice - adjustment),
        midPrice + this._priceSpan * (priceExtent[1] - midPrice + adjustment),
      ])
      .range([this.height - resolution * AXIS_HEIGHT, 0]);

    this.chart.colors = this._colors;

    this.chart.update(
      priceScale,
      timeScale,
      this._data.map((d) => [timeScale(d.date), priceScale(d.price)]),
      priceScale(this._data[0].price),
      this.height
    );

    this.ui.colors = this._colors;

    this.ui.update(this._data, timeScale, priceScale, this._data[0].price);
  }

  set colors(colors: Colors) {
    this._colors = colors;

    this.update();
    this.render();
  }

  get data() {
    return this._data;
  }

  set data(data: { date: Date; price: number }[]) {
    this._data = data;

    this.update();
    this.render();
  }

  get height(): number {
    return this.chart.renderer.view.height;
  }

  get width(): number {
    return this.chart.renderer.view.width;
  }

  get span() {
    return this._timeSpan;
  }

  set span(span: number) {
    this._timeSpan = span;

    this.update();
    this.render();
  }
}
