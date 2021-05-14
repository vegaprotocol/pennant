import { gql } from '@apollo/client'

export const marketDetailQuery = gql`
  query marketDetail($id: ID!) {
    market(id: $id) {
      id
      name
      state
      decimalPlaces
      tradingModeConfig {
        ... on ContinuousTrading {
          __typename
          tickSize
        }
        ... on DiscreteTrading {
          __typename
          duration
        }
      }
      priceMonitoringSettings {
        updateFrequencySecs
        parameters {
          triggers {
            probability
            horizonSecs
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
        updateFrequencySecs
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
              maturity
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
`
