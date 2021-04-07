import gql from "graphql-tag";

export const marketQuery = gql`
  query marketQuery($marketId: ID!) {
    market(id: $marketId) {
      id
      decimalPlaces
      data {
        priceMonitoringBounds {
          minValidPrice
          maxValidPrice
          referencePrice
        }
      }
    }
  }
`;
