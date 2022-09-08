import { ApolloClient, ObservableSubscription } from "@apollo/client";

import { Annotation, Candle, DataSource, LabelAnnotation } from "../..";
import {
  CandleDetails,
  candleQuery,
  candlesQuery,
  candlesQueryVariables,
  candleSubscriptionQuery,
  Interval,
  marketDetail,
  marketDetailQuery,
  marketDetailVariables,
  order,
  orderQuery,
  orders_orders,
  OrderStatus,
  orderVariables,
  positionQuery,
  positions,
  positions_party_positions,
  positionsVariables,
} from "../api/vega-graphql";
import { intervalMap, parseVegaDecimal } from "../helpers";
import {
  createOrderLabelAnnotation,
  createPositionLabelAnnotation,
} from "./create-annotations";

export enum OrderBlockChainState {
  Optimistic = "Optimistic",
}

const defaultConfig = {
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

function isActiveOrPartiallyFilledAndNotOptimistic(order: orders_orders) {
  return (
    (order.status === OrderStatus.Active ||
      order.status === OrderStatus.PartiallyFilled) &&
    order.createdAt !== OrderBlockChainState.Optimistic
  );
}

function parseCandle(candle: CandleDetails, decimalPlaces: number): Candle {
  return {
    date: new Date(candle.datetime),
    high: parseVegaDecimal(candle.high, decimalPlaces),
    low: parseVegaDecimal(candle.low, decimalPlaces),
    open: parseVegaDecimal(candle.open, decimalPlaces),
    close: parseVegaDecimal(candle.close, decimalPlaces),
    volume: Number(candle.volume),
  };
}

/**
 * A data access object that provides access to the Vega GraphQL API.
 */
export class VegaDataSource implements DataSource {
  client: ApolloClient<any>;
  marketId: string;
  partyId: string;
  _decimalPlaces: number = 0;

  candlesSub: ObservableSubscription | null = null;
  marketDataSub: ObservableSubscription | null = null;
  positionsSub: ObservableSubscription | null = null;
  ordersSub: ObservableSubscription | null = null;
  orderAnnotations: Annotation[] = [];
  positionAnnotations: Annotation[] = [];

  onOrderCancelled: (id: string) => void;

  /**
   * Indicates the number of decimal places that an integer must be shifted by in order to get a correct
   * number denominated in the currency of the Market.
   */
  get decimalPlaces(): number {
    return this._decimalPlaces;
  }

  /**
   *
   * @param client - An ApolloClient instance.
   * @param marketId - Market identifier.
   * @param partyId - Party identifier.
   * @param onOrderClosed - Callback called when the user initiates closing an order
   */
  constructor(
    client: ApolloClient<any>,
    marketId: string,
    partyId: string,
    onOrderClosed: (id: string) => void
  ) {
    this.client = client;
    this.marketId = marketId;
    this.partyId = partyId;
    this.onOrderCancelled = onOrderClosed;
  }

  /**
   * Used by the charting library to initialize itself.
   */
  async onReady() {
    try {
      const { data } = await this.client.query<
        marketDetail,
        marketDetailVariables
      >({
        query: marketDetailQuery,
        variables: {
          id: this.marketId,
        },
        fetchPolicy: "no-cache",
      });

      if (data && data.market && data.market.data) {
        this._decimalPlaces = data.market.decimalPlaces;

        return {
          decimalPlaces: this._decimalPlaces,
          supportedIntervals: [
            Interval.I1D,
            Interval.I6H,
            Interval.I1H,
            Interval.I15M,
            Interval.I5M,
            Interval.I1M,
          ],
          priceMonitoringBounds:
            data.market.data.priceMonitoringBounds?.map((bounds: any) => ({
              maxValidPrice: parseVegaDecimal(
                bounds.maxValidPrice,
                this._decimalPlaces
              ),
              minValidPrice: parseVegaDecimal(
                bounds.minValidPrice,
                this._decimalPlaces
              ),
              referencePrice: parseVegaDecimal(
                bounds.referencePrice,
                this._decimalPlaces
              ),
            })) ?? [],
        };
      } else {
        return defaultConfig;
      }
    } catch {
      return defaultConfig;
    }
  }

  /**
   * Used by the charting library to get historical data.
   */
  async query(interval: Interval, from: string) {
    try {
      const { data } = await this.client.query<
        candlesQuery,
        candlesQueryVariables
      >({
        query: candleQuery,
        variables: {
          marketId: this.marketId,
          interval: intervalMap[interval],
          since: from,
        },
        fetchPolicy: "no-cache",
      });

      if (data && data.market && data.market.candles) {
        const decimalPlaces = data.market.decimalPlaces;

        const candles = data.market.candles
          .filter((d): d is CandleDetails => d !== null)
          .map((d) => parseCandle(d, decimalPlaces));

        return candles;
      } else {
        return [];
      }
    } catch (error) {
      return [];
    }
  }

  /**
   * Used by the charting library to create a subscription to streaming data.
   */
  subscribeData(interval: Interval, onSubscriptionData: (data: any) => void) {
    const res = this.client.subscribe({
      query: candleSubscriptionQuery,
      variables: { marketId: this.marketId, interval: intervalMap[interval] },
    });

    this.candlesSub = res.subscribe(({ data }) => {
      const candle = parseCandle(data.candles, this.decimalPlaces);

      onSubscriptionData(candle);
    });
  }

  /**
   * Used by the charting library to clean-up a subscription to streaming data.
   */
  unsubscribeData() {
    this.candlesSub && this.candlesSub.unsubscribe();
  }

  /**
   * Used by the charting library to create a subscription to streaming annotation data.
   */
  subscribeAnnotations(
    onSubscriptionAnnotation: (annotations: Annotation[]) => void
  ) {
    if (this.partyId !== "") {
      this.ordersSub = this.client
        .watchQuery<order, orderVariables>({
          query: orderQuery,
          variables: { partyId: this.partyId },
          fetchPolicy: "cache-first",
        })
        .subscribe(({ data }) => {
          if (data.party?.orders) {
            this.updateOrders(data.party.orders, onSubscriptionAnnotation);
          }
        });

      this.positionsSub = this.client
        .watchQuery<positions, positionsVariables>({
          query: positionQuery,
          variables: { partyId: this.partyId },
          fetchPolicy: "cache-first",
        })
        .subscribe(({ data }) => {
          if (data.party?.positions) {
            this.updatePositions(
              data.party.positions,
              onSubscriptionAnnotation
            );
          }
        });
    }
  }

  /**
   * Used by the charting library to clean-up a subscription to streaming annotation data.
   */
  unsubscribeAnnotations() {
    this.ordersSub && this.ordersSub.unsubscribe();
    this.positionsSub && this.positionsSub.unsubscribe();
  }

  private updatePositions(
    positions: positions_party_positions[],
    onSubscriptionAnnotation: (annotations: Annotation[]) => void
  ) {
    const validPositions = positions.filter(
      (position) => position.market.id === this.marketId
    );

    const positionAnnotations: LabelAnnotation[] = [];

    for (const position of validPositions) {
      positionAnnotations.push(
        createPositionLabelAnnotation(position, this._decimalPlaces)
      );
    }

    this.positionAnnotations = positionAnnotations;

    onSubscriptionAnnotation([
      ...this.positionAnnotations,
      ...this.orderAnnotations,
    ]);
  }

  private updateOrders(
    orders: orders_orders[],
    onSubscriptionAnnotation: (annotations: Annotation[]) => void
  ) {
    const validOrders = orders
      .filter((order) => order.market?.id === this.marketId)
      .filter(isActiveOrPartiallyFilledAndNotOptimistic);

    const orderAnnotations: LabelAnnotation[] = [];

    for (const order of validOrders) {
      orderAnnotations.push(
        createOrderLabelAnnotation(
          order,
          this._decimalPlaces,
          this.onOrderCancelled
        )
      );
    }

    this.orderAnnotations = orderAnnotations;

    onSubscriptionAnnotation([
      ...this.positionAnnotations,
      ...this.orderAnnotations,
    ]);
  }
}
