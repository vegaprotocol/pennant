/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { MarketTradingMode } from "./globalTypes";

// ====================================================
// GraphQL subscription operation: positionSubscribe
// ====================================================

export interface positionSubscribe_positions_market_accounts {
  __typename: "Account";
  /**
   * Balance as string - current account balance (approx. as balances can be updated several times per second)
   */
  balance: string;
}

export interface positionSubscribe_positions_market_data_market {
  __typename: "Market";
  /**
   * Market ID
   */
  id: string;
}

export interface positionSubscribe_positions_market_data {
  __typename: "MarketData";
  /**
   * market id of the associated mark price
   */
  market: positionSubscribe_positions_market_data_market;
  /**
   * the mark price (actually an unsgined int)
   */
  markPrice: string;
  /**
   * what state the market is in (auction, continuous etc)
   */
  marketTradingMode: MarketTradingMode;
}

export interface positionSubscribe_positions_market_tradableInstrument_instrument_metadata {
  __typename: "InstrumentMetadata";
  /**
   * An arbitrary list of tags to associated to associate to the Instrument (string list)
   */
  tags: string[] | null;
}

export interface positionSubscribe_positions_market_tradableInstrument_instrument_product_settlementAsset {
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

export interface positionSubscribe_positions_market_tradableInstrument_instrument_product {
  __typename: "Future";
  /**
   * The name of the asset (string)
   */
  settlementAsset: positionSubscribe_positions_market_tradableInstrument_instrument_product_settlementAsset;
  /**
   * String representing the quote (e.g. BTCUSD -> USD is quote)
   */
  quoteName: string;
  /**
   * RFC3339Nano maturity date of the product
   */
  maturity: string;
}

export interface positionSubscribe_positions_market_tradableInstrument_instrument {
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
  metadata: positionSubscribe_positions_market_tradableInstrument_instrument_metadata;
  /**
   * A short non necessarily unique code used to easily describe the instrument (e.g: FX:BTCUSD/DEC18) (string)
   */
  code: string;
  /**
   * A reference to or instance of a fully specified product, including all required product parameters for that product (Product union)
   */
  product: positionSubscribe_positions_market_tradableInstrument_instrument_product;
}

export interface positionSubscribe_positions_market_tradableInstrument {
  __typename: "TradableInstrument";
  /**
   * An instance of or reference to a fully specified instrument.
   */
  instrument: positionSubscribe_positions_market_tradableInstrument_instrument;
}

export interface positionSubscribe_positions_market {
  __typename: "Market";
  /**
   * Market ID
   */
  id: string;
  /**
   * Get account for a party or market
   */
  accounts: positionSubscribe_positions_market_accounts[] | null;
  /**
   * marketData for the given market
   */
  data: positionSubscribe_positions_market_data;
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
  tradableInstrument: positionSubscribe_positions_market_tradableInstrument;
}

export interface positionSubscribe_positions_margins {
  __typename: "MarginLevels";
  /**
   * minimal margin for the position to be maintained in the network (unsigned int actually)
   */
  maintenanceLevel: string;
  /**
   * if the margin is between maintenance and search, the network will initiate a collateral search (unsigned int actually)
   */
  searchLevel: string;
  /**
   * this is the minimal margin required for a trader to place a new order on the network (unsigned int actually)
   */
  initialLevel: string;
  /**
   * If the margin of the trader is greater than this level, then collateral will be released from the margin account into
   * the general account of the trader for the given asset.
   */
  collateralReleaseLevel: string;
}

export interface positionSubscribe_positions {
  __typename: "Position";
  /**
   * Market relating to this position
   */
  market: positionSubscribe_positions_market;
  /**
   * margins of the party for the given position
   */
  margins: positionSubscribe_positions_margins[] | null;
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

export interface positionSubscribe {
  /**
   * Subscribe to the positions updates
   */
  positions: positionSubscribe_positions;
}

export interface positionSubscribeVariables {
  partyId: string;
}
