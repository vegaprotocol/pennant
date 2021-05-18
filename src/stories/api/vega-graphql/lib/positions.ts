import { MarketTradingMode } from "..";

export interface positions_party_positions {
  __typename: "Position";
  /**
   * Market relating to this position
   */
  market: positions_party_positions_market;
  /**
   * Realised Profit and Loss (int64)
   */
  realisedPNL: string;
  /**
   * Open volume (uint64)
   */
  openVolume: string;
  /**
   * Unrealised Profit and Loss (int64)
   */
  unrealisedPNL: string;
  /**
   * Average entry price for this position
   */
  averageEntryPrice: string;
}

export interface positions_party_positions_market {
  __typename: "Market";
  /**
   * Market ID
   */
  id: string;
  /**
   * marketData for the given market
   */
  data: positions_party_positions_market_data;
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
   * An instance of or reference to a tradable instrument.
   */
  tradableInstrument: positions_party_positions_market_tradableInstrument;
}

export interface positions_party_positions_market_data {
  __typename: "MarketData";
  /**
   * market id of the associated mark price
   */
  market: positions_party_positions_market_data_market;
  /**
   * the mark price (actually an unsgined int)
   */
  markPrice: string;
  /**
   * what state the market is in (auction, continuous etc)
   */
  marketTradingMode: MarketTradingMode;
}

export interface positions_party_positions_market_tradableInstrument {
  __typename: "TradableInstrument";
  /**
   * An instance of or reference to a fully specified instrument.
   */
  instrument: positions_party_positions_market_tradableInstrument_instrument;
}

export interface positions_party_positions_market_tradableInstrument_instrument {
  __typename: "Instrument";
  /**
   * Uniquely identify an instrument accrods all instruments available on Vega (string)
   */
  id: string;
  /**
   * Full and fairly descriptive name for the instrument
   */
  name: string;
  /**
   * Metadata for this instrument
   */
  metadata: positions_party_positions_market_tradableInstrument_instrument_metadata;
  /**
   * A short non necessarily unique code used to easily describe the instrument (e.g: FX:BTCUSD/DEC18) (string)
   */
  code: string;
  /**
   * A reference to or instance of a fully specified product, including all required product parameters for that product (Product union)
   */
  product: positions_party_positions_market_tradableInstrument_instrument_product;
}

export interface positions_party_positions_market_data_market {
  __typename: "Market";
  /**
   * Market ID
   */
  id: string;
}

export interface positions_party_positions_market_tradableInstrument_instrument_metadata {
  __typename: "InstrumentMetadata";
  /**
   * An arbitrary list of tags to associated to associate to the Instrument (string list)
   */
  tags: string[] | null;
}

export interface positions_party_positions_market_tradableInstrument_instrument_product {
  __typename: "Future";
  /**
   * The name of the asset (string)
   */
  settlementAsset: positions_party_positions_market_tradableInstrument_instrument_product_settlementAsset;
  /**
   * String representing the quote (e.g. BTCUSD -> USD is quote)
   */
  quoteName: string;
  /**
   * RFC3339Nano maturity date of the product
   */
  maturity: string;
}

export interface positions_party_positions_market_tradableInstrument_instrument_product_settlementAsset {
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

export interface positions_party {
  __typename: "Party";
  /**
   * Party identifier
   */
  id: string;
  /**
   * Trading positions relating to a party
   */
  positions: positions_party_positions[] | null;
}

export interface positions {
  /**
   * An entity that is trading on the VEGA network
   */
  party: positions_party | null;
}

export interface positionsVariables {
  partyId: string;
}
