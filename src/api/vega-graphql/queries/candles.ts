import gql from "graphql-tag";

export const candleFragment = gql`
  fragment CandleDetails on Candle {
    datetime
    high
    low
    open
    close
    volume
  }
`;

export const candleQuery = gql`
  query candlesQuery(
    $marketId: String!
    $interval: Interval!
    $since: String!
  ) {
    market(id: $marketId) {
      id
      decimalPlaces
      tradableInstrument {
        instrument {
          id
          name
          code
        }
      }
      candles(interval: $interval, since: $since) {
        ...CandleDetails
      }
    }
  }
  ${candleFragment}
`;

export const candleSubscriptionQuery = gql`
  subscription candleSubscription($marketId: String!, $interval: Interval!) {
    candles(marketId: $marketId, interval: $interval) {
      ...CandleDetails
    }
  }
  ${candleFragment}
`;
