import gql from "graphql-tag";

export const marketQuery = gql`
  query marketQuery($marketId: String!) {
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
