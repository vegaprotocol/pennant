import { DataSource } from "../types/data-source";
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

  async query(_interval: Interval, _from: string, _to: string) {
    const candles = json.data.market.candles?.map((d) =>
      extendCandle(d, this.decimalPlaces)
    );

    return Promise.resolve(candles);
  }

  subscribe(_interval: Interval, _onSubscriptionData: (data: any) => void) {}

  unsubscribe() {}
}
