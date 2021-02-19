import { candleQuery, candleSubscriptionQuery } from "./queries/candles";
import { candlesQuery, candlesQueryVariables } from "./candlesQuery";

import { ApolloClient } from "@apollo/client";
import { DataSource } from "../types/data-source";
import { Interval } from "./globalTypes";
import { addDecimal } from "../lib/decimal";
import json from "../data.json";

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
  client: ApolloClient<any>;
  sub: any = null;
  marketId: string;

  constructor(client: ApolloClient<any>, marketId: string) {
    this.client = client;
    this.marketId = marketId;
  }

  async query(interval: Interval, from: string, to: string) {
    const decimalPlaces = json.data.market.decimalPlaces;
    const candles = json.data.market.candles?.map((d) =>
      extendCandle(d, decimalPlaces)
    );

    return Promise.resolve(candles);
  }

  subscribe(interval: Interval, onSubscriptionData: (data: any) => void) {
    const res = this.client.subscribe({
      query: candleSubscriptionQuery,
      variables: { marketId: this.marketId, interval },
    });

    this.sub = res.subscribe(({ data }) => {
      const candle = extendCandle(data.candles, 5); // FIXME: Get from subscription

      onSubscriptionData(candle);
    });

    return this.sub;
  }

  unsubscribe() {
    return this.sub && this.sub.unsubscribe();
  }
}
