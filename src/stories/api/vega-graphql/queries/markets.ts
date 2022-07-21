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

export const marketsQuery = gql`
  query markets {
    markets {
      id
      name
      decimalPlaces
      state
      fees {
        factors {
          infrastructureFee
          makerFee
          liquidityFee
        }
      }
      data {
        market {
          id
        }
        bestBidPrice
        bestBidVolume
        bestOfferPrice
        bestOfferVolume
        marketTradingMode
        markPrice
        openInterest
        auctionStart
        auctionEnd
      }
      tradableInstrument {
        instrument {
          id
          metadata {
            tags
          }
          name
          code
          product {
            ... on Future {
              quoteName
              settlementAsset {
                id
                symbol
                name
                decimals
              }
            }
          }
        }
      }
    }
  }
`;
