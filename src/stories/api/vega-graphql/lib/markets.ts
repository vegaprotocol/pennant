import { MarketState, MarketTradingMode } from "./globalTypes";

// ====================================================
// GraphQL query operation: markets
// ====================================================

export interface markets_markets_fees_factors {
  __typename: "FeeFactors";
  /**
   * The factor applied to calculate InfrastructureFees, a non-negative float
   */
  infrastructureFee: string;
  /**
   * The factor applied to calculate MakerFees, a non-negative float
   */
  makerFee: string;
  /**
   * The factor applied to calculate LiquidityFees, a non-negative float
   */
  liquidityFee: string;
}

export interface markets_markets_fees {
  __typename: "Fees";
  /**
   * The factors used to calculate the different fees
   */
  factors: markets_markets_fees_factors;
}

export interface markets_markets_data_market {
  __typename: "Market";
  /**
   * Market ID
   */
  id: string;
}

export interface markets_markets_data {
  __typename: "MarketData";
  /**
   * market id of the associated mark price
   */
  market: markets_markets_data_market;
  /**
   * the highest price level on an order book for buy orders.
   */
  bestBidPrice: string;
  /**
   * the aggregated volume being bid at the best bid price.
   */
  bestBidVolume: string;
  /**
   * the lowest price level on an order book for offer orders.
   */
  bestOfferPrice: string;
  /**
   * the aggregated volume being offered at the best offer price.
   */
  bestOfferVolume: string;
  /**
   * what state the market is in (auction, continuous etc)
   */
  marketTradingMode: MarketTradingMode;
  /**
   * the mark price (actually an unsgined int)
   */
  markPrice: string;
  /**
   * the sum of the size of all positions greater than 0.
   */
  openInterest: string;
  /**
   * RFC3339Nano time at which the next auction will start (null if none is scheduled)
   */
  auctionStart: string | null;
  /**
   * RFC3339Nano time at which the auction will stop (null if not in auction mode)
   */
  auctionEnd: string | null;
}

export interface markets_markets_tradableInstrument_instrument_metadata {
  __typename: "InstrumentMetadata";
  /**
   * An arbitrary list of tags to associated to associate to the Instrument (string list)
   */
  tags: string[] | null;
}

export interface markets_markets_tradableInstrument_instrument_product_settlementAsset {
  __typename: "Asset";
  /**
   * The id of the asset
   */
  id: string;
  /**
   * The symbol of the asset (e.g: GBP)
   */
  symbol: string;
  /**
   * The full name of the asset (e.g: Great British Pound)
   */
  name: string;
  /**
   * The precision of the asset
   */
  decimals: number;
}

export interface markets_markets_tradableInstrument_instrument_product {
  __typename: "Future";
  /**
   * RFC3339Nano maturity date of the product
   */
  maturity: string;
  /**
   * String representing the quote (e.g. BTCUSD -> USD is quote)
   */
  quoteName: string;
  /**
   * The name of the asset (string)
   */
  settlementAsset: markets_markets_tradableInstrument_instrument_product_settlementAsset;
}

export interface markets_markets_tradableInstrument_instrument {
  __typename: "Instrument";
  /**
   * Uniquely identify an instrument accrods all instruments available on Vega (string)
   */
  id: string;
  /**
   * Metadata for this instrument
   */
  metadata: markets_markets_tradableInstrument_instrument_metadata;
  /**
   * Full and fairly descriptive name for the instrument
   */
  name: string;
  /**
   * A short non necessarily unique code used to easily describe the instrument (e.g: FX:BTCUSD/DEC18) (string)
   */
  code: string;
  /**
   * A reference to or instance of a fully specified product, including all required product parameters for that product (Product union)
   */
  product: markets_markets_tradableInstrument_instrument_product;
}

export interface markets_markets_tradableInstrument {
  __typename: "TradableInstrument";
  /**
   * An instance of or reference to a fully specified instrument.
   */
  instrument: markets_markets_tradableInstrument_instrument;
}

export interface markets_markets {
  __typename: "Market";
  /**
   * Market ID
   */
  id: string;
  /**
   * Market full name
   */
  name: string;
  /**
   * decimalPlaces indicates the number of decimal places that an integer must be shifted by in order to get a correct
   * number denominated in the currency of the Market. (uint64)
   *
   * Examples:
   * Currency     Balance  decimalPlaces  Real Balance
   * GBP              100              0       GBP 100
   * GBP              100              2       GBP   1.00
   * GBP              100              4       GBP   0.01
   * GBP                1              4       GBP   0.0001   (  0.01p  )
   *
   * GBX (pence)      100              0       GBP   1.00     (100p     )
   * GBX (pence)      100              2       GBP   0.01     (  1p     )
   * GBX (pence)      100              4       GBP   0.0001   (  0.01p  )
   * GBX (pence)        1              4       GBP   0.000001 (  0.0001p)
   */
  decimalPlaces: number;
  /**
   * Current state of the market
   */
  state: MarketState;
  /**
   * Fees related data
   */
  fees: markets_markets_fees;
  /**
   * marketData for the given market
   */
  data: markets_markets_data;
  /**
   * An instance of or reference to a tradable instrument.
   */
  tradableInstrument: markets_markets_tradableInstrument;
}

export interface markets {
  /**
   * One or more instruments that are trading on the VEGA network
   */
  markets: markets_markets[] | null;
}
