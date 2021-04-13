import {
  Interval,
  candleQuery,
  candleSubscriptionQuery,
  candlesQuery,
  candlesQueryVariables,
} from "../api/vega-graphql";

import { ApolloClient } from "@apollo/client";
import { Annotation, DataSource } from "../../types";
import { addDecimal } from "../helpers";
import { marketQuery } from "../api/vega-graphql/queries/markets";
import { positionSubscription } from "../api/vega-graphql/queries/position";

export interface Order {
  type: "order";
  id: string;
  price: number;
  timeInForce: number;
  side: string;
  market: string;
  size: number;
  party: string;
  orderType: string;
}

export interface Position {
  type: "position";
  market: string;
  party: string;
  openVolume: number;
  realisedPNL: number;
  unrealisedPNL: number;
  averageEntryPrice: number;
  margins: number;
  updatedAt: Date;
}

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
  candlesSub: ZenObservable.Subscription | null = null;
  marketDataSub: ZenObservable.Subscription | null = null;
  positionsSub: ZenObservable.Subscription | null = null;
  ordersSub: ZenObservable.Subscription | null = null;
  marketId: string;
  partyId: string;
  _decimalPlaces: number;

  get decimalPlaces(): number {
    return this._decimalPlaces;
  }

  constructor(
    client: ApolloClient<any>,
    marketId: string,
    partyId: string,
    decimalPlaces: number
  ) {
    this.client = client;
    this.marketId = marketId;
    this.partyId = partyId;
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
        priceMonitoringBounds: [],
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
    const { data } = await this.client.query<
      candlesQuery,
      candlesQueryVariables
    >({
      query: candleQuery,
      variables: {
        marketId: this.marketId,
        interval,
        since: from,
      },
      fetchPolicy: "no-cache",
    });

    if (data && data.market && data.market.candles) {
      const decimalPlaces = data.market.decimalPlaces;

      const candles = data.market.candles
        .filter((d) => d !== null)
        .map((d) => extendCandle(d, decimalPlaces));

      return candles;
    } else {
      return [];
    }
  }

  subscribeData(interval: Interval, onSubscriptionData: (datum: any) => void) {
    const candlesObervable = this.client.subscribe({
      query: candleSubscriptionQuery,
      variables: { marketId: this.marketId, interval },
    });

    this.candlesSub = candlesObervable.subscribe(({ data }) => {
      const candle = extendCandle(data.candles, this.decimalPlaces);
      onSubscriptionData(candle);
    });
  }

  unsubscribeData() {
    return this.candlesSub && this.candlesSub.unsubscribe();
  }

  subscribeAnnotations(
    onSubscriptionAnnotation: (annotations: Annotation[]) => void
  ) {
    const positionsObservable = this.client.subscribe({
      query: positionSubscription,
      variables: { partyId: this.partyId },
    });

    this.positionsSub = positionsObservable.subscribe(({ data }) => {
      console.info(data);
      onSubscriptionAnnotation(data);
    });
  }

  unsubscribeAnnotations() {
    return this.positionsSub && this.positionsSub.unsubscribe();
  }
}
