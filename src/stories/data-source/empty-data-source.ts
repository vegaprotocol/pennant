import { DataSource } from "../../types";
import { Interval } from "../api/vega-graphql";
import { addDecimal } from "../helpers";
import json from "./data.json";

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

export class EmptyDataSource implements DataSource {
  _decimalPlaces = 0;

  get decimalPlaces(): number {
    return this._decimalPlaces;
  }

  async onReady() {
    return Promise.resolve({
      decimalPlaces: this._decimalPlaces,
      supportedIntervals: [Interval.I1D, Interval.I1H, Interval.I1M],
      priceMonitoringBounds: {},
    });
  }

  async query(_interval: Interval, _from: string, _to: string) {
    return Promise.resolve([]);
  }

  subscribe(_interval: Interval, _onSubscriptionData: (data: any) => void) {}

  unsubscribe() {}
}
