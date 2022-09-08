import { gql } from "@apollo/client";

export const marketDetailQuery = gql`
  query marketDetail($id: ID!) {
    market(id: $id) {
      id
      name
      state
      decimalPlaces
      tradingMode
      priceMonitoringSettings {
        parameters {
          triggers {
            horizonSecs
            probability
            auctionExtensionSecs
          }
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
        bestStaticBidPrice
        bestStaticBidVolume
        bestStaticOfferPrice
        bestStaticOfferVolume
        openInterest
        marketTradingMode
        auctionEnd
        markPrice
        midPrice
        timestamp
        targetStake
        suppliedStake
        marketValueProxy
        trigger
        indicativePrice
        indicativeVolume
        priceMonitoringBounds {
          referencePrice
          minValidPrice
          maxValidPrice
          trigger {
            horizonSecs
            probability
            auctionExtensionSecs
          }
        }
      }
      priceMonitoringSettings {
        parameters {
          triggers {
            horizonSecs
            probability
            auctionExtensionSecs
          }
        }
      }
      fees {
        factors {
          infrastructureFee
          makerFee
          liquidityFee
        }
      }
      tradableInstrument {
        instrument {
          id
          code
          name
          metadata {
            tags
          }
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
        riskModel {
          __typename
          ... on LogNormalRiskModel {
            riskAversionParameter
            tau
            params {
              mu
              r
              sigma
            }
          }
          ... on SimpleRiskModel {
            params {
              factorLong
              factorShort
            }
          }
        }
      }
      accounts {
        type
        balance
      }
      liquidityMonitoringParameters {
        triggeringRatio
        targetStakeParameters {
          scalingFactor
        }
      }
    }
  }
`;
