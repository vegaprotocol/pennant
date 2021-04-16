import gql from "graphql-tag";

export const positionFragment = gql`
  fragment PositionDetails on Position {
    market {
      id
      accounts(partyId: $partyId) {
        balance
      }
      data {
        market {
          id
        }
        markPrice
        marketTradingMode
      }
      decimalPlaces
      tradableInstrument {
        instrument {
          id
          name
          metadata {
            tags
          }
          code
          product {
            ... on Future {
              settlementAsset {
                id
                symbol
                name
                decimals
              }
              quoteName
              maturity
            }
          }
        }
      }
    }
    margins {
      maintenanceLevel
      searchLevel
      initialLevel
      collateralReleaseLevel
    }
    realisedPNL
    openVolume
    unrealisedPNL
    averageEntryPrice
  }
`;

export const positionQuery = gql`
  ${positionFragment}
  query positions($partyId: ID!) {
    party(id: $partyId) {
      id
      positions {
        ...PositionDetails
      }
    }
  }
`;

export const positionSubscription = gql`
  ${positionFragment}
  subscription positionSubscribe($partyId: ID!) {
    positions(partyId: $partyId) {
      ...PositionDetails
    }
  }
`;
