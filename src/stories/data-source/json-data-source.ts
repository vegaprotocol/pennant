import {
  Annotation,
  Configuration,
  DataSource,
  LabelAnnotation,
} from "@util/types";

import { Interval } from "../api/vega-graphql";
import { parseVegaDecimal } from "../helpers";
import json from "./data.json";
import noChangeJson from "./no-change-data.json";
import zeroVolumeCandlesJson from "./zero-volume-candles-data.json";

const files = new Map([
  ["data.json", json],
  ["no-change-data.json", noChangeJson],
  ["zero-volume-candles-data.json", zeroVolumeCandlesJson],
]);

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
    id: "2",
    cells: [
      { label: `Limit GTT`, stroke: true },
      { label: `${596.5}` },
      {
        label: "Cancel",
        onClick: () => {
          console.log({ type: "order", id: "2" });
          const annotation = annotations.find(
            (annotation) => annotation.id === "2",
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

export function extendCandle(
  candle: any,
  decimalPlaces: number,
  positionDecimalPlaces: number,
): any {
  return {
    ...candle,
    date: new Date(candle.datetime),
    high: parseVegaDecimal(candle.high, decimalPlaces),
    low: parseVegaDecimal(candle.low, decimalPlaces),
    open: parseVegaDecimal(candle.open, decimalPlaces),
    close: parseVegaDecimal(candle.close, decimalPlaces),
    volume: parseVegaDecimal(candle.volume, positionDecimalPlaces),
  };
}

export class JsonDataSource implements DataSource {
  sub: any = null;
  marketId: string;
  _decimalPlaces: number;
  _positionDecimalPlaces: number;
  filename: string;
  annotations: boolean;

  get decimalPlaces(): number {
    return this._decimalPlaces;
  }

  get positionDecimalPlaces(): number {
    return this._positionDecimalPlaces;
  }

  constructor(
    marketId: string,
    decimalPlaces: number,
    filename: string = "data.json",
    annotations: boolean = true,
  ) {
    this.marketId = marketId;
    this._decimalPlaces = decimalPlaces;
    this._positionDecimalPlaces = 2;
    this.filename = filename;
    this.annotations = annotations;
  }

  async onReady(): Promise<Configuration> {
    return Promise.resolve({
      decimalPlaces: this.decimalPlaces,
      supportedIntervals: [Interval.I1D, Interval.I1H, Interval.I1M],
      priceMonitoringBounds: [
        {
          minValidPrice: 595,
          maxValidPrice: 597,
          referencePrice: 596,
        },
        {
          minValidPrice: 594,
          maxValidPrice: 598,
          referencePrice: 596,
        },
      ],
    });
  }

  async query(interval: Interval, _from: string, _to: string) {
    const data: any = files.get(this.filename);

    const candles = data[interval].candles.map((d: any) =>
      extendCandle(d, this.decimalPlaces, this.positionDecimalPlaces),
    );

    return Promise.resolve(candles);
  }

  subscribeData(
    _interval: Interval,
    _onSubscriptionData: (datum: any) => void,
  ) {}

  unsubscribeData() {}

  subscribeAnnotations(
    onSubscriptionAnnotation: (annotations: Annotation[]) => void,
  ) {
    if (this.annotations) {
      onSubscriptionAnnotation(annotations);

      setInterval(() => {
        const averageEntryPrice = 595 + Math.random();

        onSubscriptionAnnotation(annotations);
      }, 5000);
    }
  }

  unsubscribeAnnotations() {}
}
