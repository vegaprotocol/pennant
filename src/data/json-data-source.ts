import { Interval, candleSubscriptionQuery } from "../api/vega-graphql";

import { ApolloClient } from "@apollo/client";
import { DataSource } from "../types/data-source";
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

  constructor(marketId: string) {
    this.marketId = marketId;
  }

  async query(interval: Interval, from: string, to: string) {
    const decimalPlaces = json.data.market.decimalPlaces;

    const candles = json.data.market.candles?.map((d) =>
      extendCandle(d, decimalPlaces)
    );

    return Promise.resolve(candles);
  }

  subscribe(_interval: Interval, _onSubscriptionData: (data: any) => void) {}

  unsubscribe() {}
}
