import {
  Interval,
  candleQuery,
  candleSubscriptionQuery,
  candlesQuery,
  candlesQueryVariables,
} from "../api/vega-graphql";

import { ApolloClient } from "@apollo/client";
import { DataSource } from "../types/data-source";
import { addDecimal } from "../helpers";

export function extendCandle(candle: any, decimalPlaces: number): any {
  return {
    ...candle,
    date: new Date(candle.datetime),
    high: Number(addDecimal(candle.high, decimalPlaces)),
    low: Number(addDecimal(candle.low, decimalPlaces)),
    open: Number(addDecimal(candle.open, decimalPlaces)),
    close: Number(addDecimal(candle.close, decimalPlaces)),
    volume: Number(addDecimal(candle.volume, decimalPlaces)),
  };
}

export class ApolloDataSource implements DataSource {
  client: ApolloClient<any>;
  sub: ZenObservable.Subscription | null = null;
  marketId: string;
  _decimalPlaces: number;

  get decimalPlaces(): number {
    return this._decimalPlaces;
  }

  constructor(
    client: ApolloClient<any>,
    marketId: string,
    decimalPlaces: number
  ) {
    this.client = client;
    this.marketId = marketId;
    this._decimalPlaces = decimalPlaces;
  }

  async onReady() {
    return Promise.resolve({
      supportedIntervals: [
        Interval.I1D,
        Interval.I6H,
        Interval.I1H,
        Interval.I15M,
        Interval.I5M,
        Interval.I1M,
      ],
    });
  }

  async query(interval: Interval, from: string, to: string) {
    const res = await this.client.query<candlesQuery, candlesQueryVariables>({
      query: candleQuery,
      variables: {
        marketId: this.marketId,
        interval,
        since: from,
      },
      fetchPolicy: "no-cache",
    });

    if (!res?.data?.market?.candles) {
      return [];
    }

    const decimalPlaces = res.data.market.decimalPlaces;
    const candles = res.data.market.candles?.map((d) =>
      extendCandle(d, decimalPlaces)
    );

    return candles;
  }

  subscribe(interval: Interval, onSubscriptionData: (data: any) => void) {
    const res = this.client.subscribe({
      query: candleSubscriptionQuery,
      variables: { marketId: this.marketId, interval },
    });

    this.sub = res.subscribe(({ data }) => {
      const candle = extendCandle(data.candles, this.decimalPlaces); // FIXME: Get from subscription

      onSubscriptionData(candle);
    });

    return this.sub;
  }

  unsubscribe() {
    return this.sub && this.sub.unsubscribe();
  }
}
