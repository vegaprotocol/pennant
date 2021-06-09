import { Annotation, DataSource, LabelAnnotation } from "../../types";
import { Interval } from "../api/vega-graphql";
import { addDecimal } from "../helpers";
import json from "./data.json";

const initialAverageEntryPrice = 595 + Math.random();

const annotations: LabelAnnotation[] = [
  {
    type: "label",
    id: "0",
    cells: [
      { label: "Position" },
      { label: `${initialAverageEntryPrice.toFixed(2)}` },
      {
        label: `PnL ${-10000000000}`,
        stroke: true,
        intent: "danger",
      },
      {
        label: "Close",
        onClick: () => {
          console.log({ type: "position", id: "0" });
        },
      },
    ],
    intent: "success",
    y: initialAverageEntryPrice,
  },
  {
    type: "label",
    id: "1",
    cells: [
      { label: `Limit GTT`, stroke: true },
      { label: `${596}` },
      {
        label: "Cancel",
        onClick: () => {
          console.log({ type: "order", id: "1" });
          const annotation = annotations.find(
            (annotation) => annotation.id === "1"
          );

          if (annotation) {
            annotation.cells[annotation.cells.length - 1].spinner =
              !annotation.cells[annotation.cells.length - 1].spinner;
          }

          console.log(annotations);
        },
        spinner: false,
      },
    ],
    intent: "danger",
    y: 596,
  },
  {
    type: "label",
    id: "2",
    cells: [
      { label: `Limit GTT`, stroke: true },
      { label: `${596.5}` },
      {
        label: "Cancel",
        onClick: () => {
          console.log({ type: "order", id: "2" });
          const annotation = annotations.find(
            (annotation) => annotation.id === "2"
          );

          if (annotation) {
            annotation.cells[annotation.cells.length - 1].spinner =
              !annotation.cells[annotation.cells.length - 1].spinner;
          }

          console.log(annotations);
        },
        spinner: true,
      },
    ],
    intent: "danger",
    y: 596.01,
  },
];

export function extendCandle(candle: any, decimalPlaces: number): any {
  return {
    ...candle,
    date: new Date(candle.datetime),
    high: Number(addDecimal(candle.high, decimalPlaces)),
    low: Number(addDecimal(candle.low, decimalPlaces)),
    open: Number(addDecimal(candle.open, decimalPlaces)),
    close: Number(addDecimal(candle.close, decimalPlaces)),
    volume: Number(addDecimal(candle.volume, 0)),
  };
}

export class JsonDataSource implements DataSource {
  sub: any = null;
  marketId: string;
  _decimalPlaces: number;

  get decimalPlaces(): number {
    return this._decimalPlaces;
  }

  constructor(marketId: string, decimalPlaces: number) {
    this.marketId = marketId;
    this._decimalPlaces = decimalPlaces;
  }

  async onReady() {
    return Promise.resolve({
      decimalPlaces: this.decimalPlaces,
      supportedIntervals: [Interval.I1D, Interval.I1H, Interval.I1M],
      priceMonitoringBounds: {},
    });
  }

  async query(interval: Interval, _from: string, _to: string) {
    const candles = json[interval].candles.map((d) =>
      extendCandle(d, this.decimalPlaces)
    );

    return Promise.resolve(candles);
  }

  subscribeData(
    _interval: Interval,
    _onSubscriptionData: (datum: any) => void
  ) {}

  unsubscribeData() {}

  subscribeAnnotations(
    onSubscriptionAnnotation: (annotations: Annotation[]) => void
  ) {
    onSubscriptionAnnotation(annotations);

    setInterval(() => {
      const averageEntryPrice = 595 + Math.random();

      onSubscriptionAnnotation(annotations);
    }, 5000);
  }

  unsubscribeAnnotations() {}
}
