import gql from "graphql-tag";

export const marketDataSubscription = gql`
  subscription marketDataSub($marketId: ID!) {
    marketData(marketId: $marketId) {
      market {
        id
      }
      priceMonitoringBounds {
        minValidPrice
        maxValidPrice
        referencePrice
      }
    }
  }
`;
