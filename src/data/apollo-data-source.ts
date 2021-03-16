import {
  Interval,
  candleQuery,
  candleSubscriptionQuery,
  candlesQuery,
  candlesQueryVariables,
} from "../api/vega-graphql";

import { ApolloClient } from "@apollo/client";
import { DataSource } from "../types";
import { addDecimal } from "../helpers";
import { marketQuery } from "../api/vega-graphql/queries/markets";

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
    const res = await this.client.query({
      query: marketQuery,
      variables: {
        marketId: this.marketId,
      },
      fetchPolicy: "no-cache",
    });

    if (!res?.data?.market?.data) {
      return {
        decimalPlaces: 5,
        supportedIntervals: [
          Interval.I1D,
          Interval.I6H,
          Interval.I1H,
          Interval.I15M,
          Interval.I5M,
          Interval.I1M,
        ],
        priceMonitoringBounds: {},
      };
    }

    const decimalPlaces = res.data.market.decimalPlaces;

    return {
      decimalPlaces: decimalPlaces,
      supportedIntervals: [
        Interval.I1D,
        Interval.I6H,
        Interval.I1H,
        Interval.I15M,
        Interval.I5M,
        Interval.I1M,
      ],
      priceMonitoringBounds: res.data.market.data.priceMonitoringBounds.map(
        (bounds: any) => ({
          maxValidPrice: Number(
            addDecimal(bounds.maxValidPrice, decimalPlaces)
          ),
          minValidPrice: Number(
            addDecimal(bounds.minValidPrice, decimalPlaces)
          ),
          referencePrice: Number(
            addDecimal(bounds.referencePrice, decimalPlaces)
          ),
        })
      ),
    };
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
      const candle = extendCandle(data.candles, this.decimalPlaces);

      console.warn(data);

      onSubscriptionData(candle);
    });

    return this.sub;
  }

  unsubscribe() {
    return this.sub && this.sub.unsubscribe();
  }
}
