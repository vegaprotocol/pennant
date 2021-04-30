import { Annotation, Candle, DataSource, LabelAnnotation } from "../../types";
import {
  Interval,
  candleQuery,
  candleSubscriptionQuery,
  candlesQuery,
  candlesQueryVariables,
} from "../api/vega-graphql";

import { ApolloClient } from "@apollo/client";
import { addDecimal } from "../helpers";
import { marketQuery } from "../api/vega-graphql/queries/markets";
import { orderSubscription } from "../api/vega-graphql/queries/order";
import { positionSubscription } from "../api/vega-graphql/queries/position";

export function extendCandle(candle: any, decimalPlaces: number): Candle {
  return {
    date: new Date(candle.datetime),
    high: Number(addDecimal(candle.high, decimalPlaces)),
    low: Number(addDecimal(candle.low, decimalPlaces)),
    open: Number(addDecimal(candle.open, decimalPlaces)),
    close: Number(addDecimal(candle.close, decimalPlaces)),
    volume: Number(candle.volume),
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
  orderAnnotations: Annotation[] = [];
  positionAnnotations: Annotation[] = [];

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

  async query(
    interval: Interval,
    from: string,
    _to: string
  ): Promise<Candle[]> {
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
    this.candlesSub && this.candlesSub.unsubscribe();
  }

  subscribeAnnotations(
    onSubscriptionAnnotation: (annotations: Annotation[]) => void
  ) {
    const positionsObservable = this.client.subscribe({
      query: positionSubscription,
      variables: { partyId: this.partyId },
    });

    const ordersObservable = this.client.subscribe({
      query: orderSubscription,
      variables: { partyId: this.partyId },
    });

    if (this.partyId) {
      this.positionsSub = positionsObservable.subscribe(({ data }) => {
        const position = data.positions;

        if (position.market.id === this.marketId) {
          const positionAnnotation: LabelAnnotation = {
            type: "label",
            id: "position",
            cells: [
              { label: "Position" },
              {
                label: `${Number(
                  addDecimal(position.averageEntryPrice, this._decimalPlaces)
                )}`,
              },
              { label: `+${Number(position.openVolume)}`, fill: true },
              {
                label: `PnL ${Number(position.unrealisedPNL)}`,
                stroke: true,
              },
              { label: "Close" },
            ],
            intent: "success",
            y: Number(
              addDecimal(position.averageEntryPrice, this._decimalPlaces)
            ),
          };

          this.positionAnnotations = [positionAnnotation];

          onSubscriptionAnnotation([
            ...this.positionAnnotations,
            ...this.orderAnnotations,
          ]);
        }
      });

      this.ordersSub = ordersObservable.subscribe(({ data }) => {
        const orders = data.orders;

        const orderAnnotations: LabelAnnotation[] = [];

        for (const order of orders) {
          if (order.market.id === this.marketId) {
            orderAnnotations.push({
              type: "label",
              id: order.id,
              cells: [
                { label: `${order.type} ${order.timeInForce}`, stroke: true },
                {
                  label: `${Number(
                    addDecimal(order.price, this._decimalPlaces)
                  )}`,
                },
                {
                  label: `${order.side === "Buy" ? "+" : "-"}${Number(
                    order.size
                  )}`,
                  stroke: true,
                },
                { label: "Cancel" },
              ],
              intent: "danger",
              y: Number(addDecimal(order.price, this._decimalPlaces)),
            });
          }
        }

        this.orderAnnotations = orderAnnotations;

        onSubscriptionAnnotation([
          ...this.positionAnnotations,
          ...this.orderAnnotations,
        ]);
      });
    }
  }

  unsubscribeAnnotations() {
    this.ordersSub && this.ordersSub.unsubscribe();
    this.positionsSub && this.positionsSub.unsubscribe();
  }
}
