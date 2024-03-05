import type { ApolloClient } from "@apollo/client";
import {
  Candle,
  DataSource,
  Interval as PennantInterval,
  PriceMonitoringBounds,
} from "@util/types";
import type { Subscription } from "zen-observable-ts";

import type {
  CandleFieldsFragment,
  CandlesEventsSubscription,
  CandlesEventsSubscriptionVariables,
  CandlesQuery,
  CandlesQueryVariables,
} from "./__generated__/Candles";
import {
  CandlesDocument,
  CandlesEventsDocument,
} from "./__generated__/Candles";
import type { ChartQuery, ChartQueryVariables } from "./__generated__/Chart";
import { ChartDocument } from "./__generated__/Chart";
import { addDecimal } from "./number";

/** The interval for trade candles when subscribing via Vega GraphQL, default is I15M */
export enum Interval {
  /** 7 day interval */
  INTERVAL_I7D = "INTERVAL_I7D",
  /** 1 day interval */
  INTERVAL_I1D = "INTERVAL_I1D",
  /** 1 hour interval */
  INTERVAL_I1H = "INTERVAL_I1H",
  /** 1 minute interval */
  INTERVAL_I1M = "INTERVAL_I1M",
  /** 5 minute interval */
  INTERVAL_I5M = "INTERVAL_I5M",
  /** 4 hour interval */
  INTERVAL_I4H = "INTERVAL_I4H",
  /** 6 hour interval */
  INTERVAL_I6H = "INTERVAL_I6H",
  /** 8 hour interval */
  INTERVAL_I8H = "INTERVAL_I8H",
  /** 12 hour interval */
  INTERVAL_I12H = "INTERVAL_I12H",
  /** 15 minute interval (default) */
  INTERVAL_I15M = "INTERVAL_I15M",
  /** 30 minute interval */
  INTERVAL_I30M = "INTERVAL_I30M",
}

const INTERVAL_TO_PENNANT_MAP = {
  [PennantInterval.I1M]: Interval.INTERVAL_I1M,
  [PennantInterval.I5M]: Interval.INTERVAL_I5M,
  [PennantInterval.I15M]: Interval.INTERVAL_I15M,
  [PennantInterval.I30M]: Interval.INTERVAL_I30M,
  [PennantInterval.I1H]: Interval.INTERVAL_I1H,
  [PennantInterval.I4H]: Interval.INTERVAL_I4H,
  [PennantInterval.I6H]: Interval.INTERVAL_I6H,
  [PennantInterval.I8H]: Interval.INTERVAL_I8H,
  [PennantInterval.I12H]: Interval.INTERVAL_I12H,
  [PennantInterval.I1D]: Interval.INTERVAL_I1D,
  [PennantInterval.I7D]: Interval.INTERVAL_I7D,
};

const defaultConfig = {
  decimalPlaces: 5,
  supportedIntervals: [
    PennantInterval.I1D,
    PennantInterval.I6H,
    PennantInterval.I1H,
    PennantInterval.I15M,
    PennantInterval.I5M,
    PennantInterval.I1M,
  ],
};

/**
 * A data access object that provides access to the Vega GraphQL API.
 */
export class VegaDataSource implements DataSource {
  client: ApolloClient<object>;
  marketId: string;
  partyId: null | string;
  _decimalPlaces = 0;
  _positionDecimalPlaces = 0;

  candlesSub: Subscription | null = null;

  /**
   * Indicates the number of decimal places that an integer must be shifted by in order to get a correct
   * number denominated in the currency of the Market.
   */
  get decimalPlaces(): number {
    return this._decimalPlaces;
  }

  /**
   * Indicates the number of position decimal places that an integer must be shifted by in order to get a correct
   * number denominated in the unit size of the Market.
   */
  get positionDecimalPlaces(): number {
    return this._positionDecimalPlaces;
  }

  /**
   *
   * @param client - An ApolloClient instance.
   * @param marketId - Market identifier.
   * @param partyId - Party identifier.
   */
  constructor(
    client: ApolloClient<object>,
    marketId: string,
    partyId: null | string = null,
  ) {
    this.client = client;
    this.marketId = marketId;
    this.partyId = partyId;
  }

  /**
   * Used by the charting library to initialize itself.
   */
  async onReady() {
    try {
      const { data } = await this.client.query<ChartQuery, ChartQueryVariables>(
        {
          query: ChartDocument,
          variables: {
            marketId: this.marketId,
          },
          fetchPolicy: "no-cache",
        },
      );

      if (data && data.market && data.market.data) {
        this._decimalPlaces = data.market.decimalPlaces;
        this._positionDecimalPlaces = data.market.positionDecimalPlaces;

        let priceMonitoringBounds: PriceMonitoringBounds[] | undefined;

        if (data.market.data.priceMonitoringBounds) {
          priceMonitoringBounds = data.market.data.priceMonitoringBounds.map(
            (bounds) => ({
              maxValidPrice: Number(
                addDecimal(bounds.maxValidPrice, this._decimalPlaces),
              ),
              minValidPrice: Number(
                addDecimal(bounds.minValidPrice, this._decimalPlaces),
              ),
              referencePrice: Number(
                addDecimal(bounds.referencePrice, this._decimalPlaces),
              ),
            }),
          );
        }

        return {
          decimalPlaces: this._decimalPlaces,
          positionDecimalPlaces: this._positionDecimalPlaces,
          supportedIntervals: [
            PennantInterval.I1D,
            PennantInterval.I6H,
            PennantInterval.I1H,
            PennantInterval.I15M,
            PennantInterval.I5M,
            PennantInterval.I1M,
          ],
          priceMonitoringBounds: priceMonitoringBounds,
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
  async query(interval: PennantInterval, from: string) {
    try {
      const { data } = await this.client.query<
        CandlesQuery,
        CandlesQueryVariables
      >({
        query: CandlesDocument,
        variables: {
          interval: INTERVAL_TO_PENNANT_MAP[interval],
          marketId: this.marketId,
          since: from,
        },
        fetchPolicy: "no-cache",
      });

      if (data?.market?.candlesConnection?.edges) {
        const decimalPlaces = data.market.decimalPlaces;
        const positionDecimalPlaces = data.market.positionDecimalPlaces;

        const candles = data.market.candlesConnection.edges
          .map((edge) => edge?.node)
          .filter((node): node is CandleFieldsFragment => !!node)
          .map((node) =>
            parseCandle(node, decimalPlaces, positionDecimalPlaces),
          );

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
  subscribeData(
    interval: PennantInterval,
    onSubscriptionData: (data: Candle) => void,
  ) {
    const res = this.client.subscribe<
      CandlesEventsSubscription,
      CandlesEventsSubscriptionVariables
    >({
      query: CandlesEventsDocument,
      variables: {
        marketId: this.marketId,
        interval: INTERVAL_TO_PENNANT_MAP[interval],
      },
    });

    this.candlesSub = res.subscribe(({ data }) => {
      if (data) {
        const candle = parseCandle(
          data.candles,
          this.decimalPlaces,
          this.positionDecimalPlaces,
        );

        onSubscriptionData(candle);
      }
    });
  }

  /**
   * Used by the charting library to clean-up a subscription to streaming data.
   */
  unsubscribeData() {
    this.candlesSub && this.candlesSub.unsubscribe();
  }
}

function parseCandle(
  candle: CandleFieldsFragment,
  decimalPlaces: number,
  positionDecimalPlaces: number,
): Candle {
  return {
    date: new Date(candle.periodStart),
    high: Number(addDecimal(candle.high, decimalPlaces)),
    low: Number(addDecimal(candle.low, decimalPlaces)),
    open: Number(addDecimal(candle.open, decimalPlaces)),
    close: Number(addDecimal(candle.close, decimalPlaces)),
    volume: Number(addDecimal(candle.volume, positionDecimalPlaces)),
  };
}
