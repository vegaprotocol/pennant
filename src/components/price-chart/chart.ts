import { extent, max, mean, min } from "d3-array";
import { scaleLinear } from "d3-scale";
import EventEmitter from "eventemitter3";
import { orderBy, sortBy, zip } from "lodash";

import cumsum from "../../math/array/cumsum";
import { Data } from "../../vega-lite/data";
import { Colors } from "../depth-chart/helpers";
import { Contents } from "./contents";
import { UI } from "./ui";

/**
 * Standard font size in CSS pixels
 */
export const FONT_SIZE = 12;

/**
 * Height of the bottom price axis
 */
export const AXIS_HEIGHT = FONT_SIZE + 5;

export class Chart extends EventEmitter {
  private chart: Contents;
  private axis: UI;

  private prices: number[] = [];
  private volumes: number[] = [];
  private priceLabels: string[] = [];
  private volumeLabels: string[] = [];

  private _span: number = 1;
  private initialSpan: number = 1;
  private maxPriceDifference: number = 0;
  private initialPriceDifference: number = 0;

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

    this.axis = new UI({
      view: options.axisView,
      resolution: options.resolution,
      width: options.width,
      height: options.height,
      colors: options.colors,
    });

    this.axis
      .on("zoomstart", () => {
        this.emit("zoomstart");
      })
      .on("zoom", (k: number) => {
        this.span = this.initialSpan / k;
        console.log(this.span);
        this.emit("zoom");
      })
      .on("zoomend", () => {
        this.emit("zoomend");
      });
  }

  public render() {
    this.chart.render();
    this.axis.render();
  }

  public resize(width: number, height: number) {
    this.chart.renderer.resize(width, height);
    this.axis.renderer.resize(width, height);
  }

  public destroy() {
    this.axis.destroy();
  }

  private update() {
    const resolution = this.axis.renderer.resolution;

    this.chart.colors = this._colors;

    this.chart.update(this._data);

    this.axis.colors = this._colors;

    const volumeScale = scaleLinear()
      .domain([0, 10])
      .range([this.height - resolution * AXIS_HEIGHT, 0]);

    this.axis.update(this._data, volumeScale, volumeScale);
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
    return this._span;
  }

  set span(span: number) {
    this._span = span;

    this.update();
    this.render();
  }
}
