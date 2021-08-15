import { extent, max, min } from "d3-array";
import { scaleLinear } from "d3-scale";
import EventEmitter from "eventemitter3";
import { orderBy, zip } from "lodash";

import cumsum from "../../math/array/cumsum";
import { Axis } from "./axis";
import { Chart } from "./chart";
import { AXIS_HEIGHT, PriceLevel } from "./depth-chart";

export const volumeFormatter = new Intl.NumberFormat("en-gb", {
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

export class Application extends EventEmitter {
  public chart: Chart;
  public axis: Axis;

  private prices: number[] = [];
  private volumes: number[] = [];
  private priceLabels: string[] = [];
  private volumeLabels: string[] = [];

  private _span: number = 1;

  private _data: { buy: PriceLevel[]; sell: PriceLevel[] } = {
    buy: [],
    sell: [],
  };

  private priceFormat: (price: number) => string;

  constructor(options: {
    chartView: HTMLCanvasElement;
    axisView: HTMLCanvasElement;
    resolution: number;
    width: number;
    height: number;
    priceFormat: (price: number) => string;
  }) {
    super();

    this.priceFormat = options.priceFormat;

    this.chart = new Chart({
      view: options.chartView,
      resolution: options.resolution,
      width: options.width,
      height: options.height,
    });

    this.axis = new Axis({
      view: options.axisView,
      resolution: options.resolution,
      width: options.width,
      height: options.height,
    });

    this.axis
      .on("zoomstart", () => {
        this.emit("zoomstart");
      })
      .on("zoom", (k: number) => {
        this.span = 1 / k;
        this.emit("zoom");
      })
      .on("zoomend", () => {
        this.emit("zoomend");
      });
  }

  public updatePrice(price: number) {
    this.axis.updatePrice(price);
  }

  public clearPrice() {
    this.axis.clearPrice();
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
    const resolution = this.axis.renderer.resolution; // TODO: Feels arbitrary that it's axis not chart

    const cumulativeBuy = zip<number>(
      this._data.buy.map((priceLevel) => priceLevel.price),
      cumsum(this._data.buy.map((priceLevel) => priceLevel.volume))
    ) as [number, number][];

    const cumulativeSell = zip<number>(
      this._data.sell.map((priceLevel) => priceLevel.price),
      cumsum(this._data.sell.map((priceLevel) => priceLevel.volume))
    ) as [number, number][];

    const midPrice = (this._data.buy[0].price + this._data.sell[0].price) / 2;

    const maxPriceDifference =
      max(this.prices.map((price) => Math.abs(price - midPrice))) ?? 0;

    const priceExtent: [number, number] = [
      midPrice - this._span * maxPriceDifference,
      midPrice + this._span * maxPriceDifference,
    ];

    const indexExtent = extent(
      orderBy([...this._data.buy, ...this._data.sell], ["price"])
        .map((priceLevel, index) => ({ ...priceLevel, index }))
        .filter(
          (priceLevel) =>
            priceLevel.price >= priceExtent[0] &&
            priceLevel.price <= priceExtent[1]
        )
        .map((priceLevel) => priceLevel.index)
    );

    const volumeExtent: [number, number] = [
      0,
      2 * (max(this.volumes.slice(indexExtent[0], indexExtent[1])) ?? 0),
    ];

    const priceScale = scaleLinear().domain(priceExtent).range([0, this.width]);

    const volumeScale = scaleLinear()
      .domain(volumeExtent)
      .range([this.height - resolution * AXIS_HEIGHT, 0]);

    const extendedCumulativeBuy = [
      ...cumulativeBuy,
      [
        midPrice - maxPriceDifference,
        cumulativeBuy[cumulativeBuy.length - 1][1],
      ],
    ] as [number, number][];

    this.chart.update(
      extendedCumulativeBuy.map((point) => [
        priceScale(point[0]),
        volumeScale(point[1]),
      ]),
      cumulativeSell.map((point) => [
        priceScale(point[0]),
        volumeScale(point[1]),
      ])
    );

    if (this._data.buy.length > 0 && this._data.sell.length > 0) {
      const minExtent = Math.abs(
        (max(this._data.buy.map((priceLevel) => priceLevel.price)) as number) -
          (min(this._data.sell.map((priceLevel) => priceLevel.price)) as number)
      );

      const maxExtent = Math.abs(
        (min(this._data.buy.map((priceLevel) => priceLevel.price)) as number) -
          (max(this._data.sell.map((priceLevel) => priceLevel.price)) as number)
      );

      this.axis.zoomExtent = [1, maxExtent / (2 * minExtent)];
    }

    this.axis.update(
      this.prices.map((price) => priceScale(price)),
      this.volumes.map((volume) => volumeScale(volume)),
      midPrice,
      this.priceLabels,
      this.volumeLabels,
      this.priceFormat(midPrice),
      priceScale,
      volumeScale
    );
  }

  get data() {
    return this._data;
  }

  set data(data: { buy: PriceLevel[]; sell: PriceLevel[] }) {
    this._data = data;

    this.prices = orderBy([
      ...this._data.buy.map((priceLevel) => priceLevel.price),
      ...this._data.sell.map((priceLevel) => priceLevel.price),
    ]);

    this.priceLabels = this.prices.map((price) => this.priceFormat(price));

    const cumulativeBuy = zip<number>(
      this._data.buy.map((priceLevel) => priceLevel.price),
      cumsum(this._data.buy.map((priceLevel) => priceLevel.volume))
    ) as [number, number][];

    const cumulativeSell = zip<number>(
      this._data.sell.map((priceLevel) => priceLevel.price),
      cumsum(this._data.sell.map((priceLevel) => priceLevel.volume))
    ) as [number, number][];

    this.volumes = orderBy([...cumulativeBuy, ...cumulativeSell], ["0"]).map(
      (priceLevel) => priceLevel[1]
    );

    this.volumeLabels = this.volumes.map((volume) =>
      volumeFormatter.format(volume)
    );

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
