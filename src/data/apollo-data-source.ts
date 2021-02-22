import { candleQuery, candleSubscriptionQuery } from "./queries/candles";
import { candlesQuery, candlesQueryVariables } from "./candlesQuery";

import { ApolloClient } from "@apollo/client";
import { DataSource } from "../types/data-source";
import { Interval } from "./globalTypes";
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
  sub: any = null;
  marketId: string;

  constructor(client: ApolloClient<any>, marketId: string) {
    this.client = client;
    this.marketId = marketId;
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
      const candle = extendCandle(data.candles, 5); // FIXME: Get from subscription

      onSubscriptionData(candle);
    });

    return this.sub;
  }

  unsubscribe() {
    return this.sub && this.sub.unsubscribe();
  }
}
