import { gql } from "@apollo/client";

import { MarketState, MarketTradingMode } from "./types";

export const MarketFieldsFragmentDoc = gql`
  fragment MarketFields on Market {
    id
    decimalPlaces
    positionDecimalPlaces
    state
    tradingMode
    fees {
      factors {
        makerFee
        infrastructureFee
        liquidityFee
      }
    }
    tradableInstrument {
      instrument {
        id
        name
        code
        metadata {
          tags
        }
        product {
          ... on Future {
            settlementAsset {
              id
              symbol
              name
              decimals
            }
            quoteName
            dataSourceSpecForTradingTermination {
              id
            }
          }
        }
      }
    }
    marketTimestamps {
      open
      close
    }
  }
`;

export const MarketsDocument = gql`
  query Markets {
    marketsConnection {
      edges {
        node {
          ...MarketFields
        }
      }
    }
  }
  ${MarketFieldsFragmentDoc}
`;

export type MarketFieldsFragment = {
  __typename?: "Market";
  id: string;
  decimalPlaces: number;
  positionDecimalPlaces: number;
  state: MarketState;
  tradingMode: MarketTradingMode;
  fees: {
    __typename?: "Fees";
    factors: {
      __typename?: "FeeFactors";
      makerFee: string;
      infrastructureFee: string;
      liquidityFee: string;
    };
  };
  tradableInstrument: {
    __typename?: "TradableInstrument";
    instrument: {
      __typename?: "Instrument";
      id: string;
      name: string;
      code: string;
      metadata: {
        __typename?: "InstrumentMetadata";
        tags?: Array<string> | null;
      };
      product: {
        __typename?: "Future";
        quoteName: string;
        settlementAsset: {
          __typename?: "Asset";
          id: string;
          symbol: string;
          name: string;
          decimals: number;
        };
        dataSourceSpecForTradingTermination: {
          __typename?: "DataSourceSpec";
          id: string;
        };
      };
    };
  };
  marketTimestamps: { __typename?: "MarketTimestamps"; open: any; close: any };
};

export type MarketsQueryVariables = { [key: string]: never };

export type MarketsQuery = {
  __typename?: "Query";
  marketsConnection?: {
    __typename?: "MarketConnection";
    edges: Array<{
      __typename?: "MarketEdge";
      node: {
        __typename?: "Market";
        id: string;
        decimalPlaces: number;
        positionDecimalPlaces: number;
        state: MarketState;
        tradingMode: MarketTradingMode;
        fees: {
          __typename?: "Fees";
          factors: {
            __typename?: "FeeFactors";
            makerFee: string;
            infrastructureFee: string;
            liquidityFee: string;
          };
        };
        tradableInstrument: {
          __typename?: "TradableInstrument";
          instrument: {
            __typename?: "Instrument";
            id: string;
            name: string;
            code: string;
            metadata: {
              __typename?: "InstrumentMetadata";
              tags?: Array<string> | null;
            };
            product: {
              __typename?: "Future";
              quoteName: string;
              settlementAsset: {
                __typename?: "Asset";
                id: string;
                symbol: string;
                name: string;
                decimals: number;
              };
              dataSourceSpecForTradingTermination: {
                __typename?: "DataSourceSpec";
                id: string;
              };
            };
          };
        };
        marketTimestamps: {
          __typename?: "MarketTimestamps";
          open: any;
          close: any;
        };
      };
    }>;
  } | null;
};
