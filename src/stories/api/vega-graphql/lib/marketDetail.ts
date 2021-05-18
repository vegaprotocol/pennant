import {
  AccountType,
  AuctionTrigger,
  MarketState,
  MarketTradingMode,
} from "./globalTypes";

// ====================================================
// GraphQL query operation: marketDetail
// ====================================================

export interface marketDetail_market_tradingModeConfig_ContinuousTrading {
  __typename: "ContinuousTrading";
  /**
   * Size of an increment in price in terms of the quote currency
   */
  tickSize: string;
}

export interface marketDetail_market_tradingModeConfig_DiscreteTrading {
  __typename: "DiscreteTrading";
  /**
   * Duration of the discrete trading batch in nanoseconds. Maximum 1 month.
   */
  duration: number;
}

export type marketDetail_market_tradingModeConfig =
  | marketDetail_market_tradingModeConfig_ContinuousTrading
  | marketDetail_market_tradingModeConfig_DiscreteTrading;

export interface marketDetail_market_priceMonitoringSettings_parameters_triggers {
  __typename: "PriceMonitoringTrigger";
  /**
   * Price monitoring probability level p. (>0 and < 1)
   */
  probability: number;
  /**
   * Price monitoring projection horizon τ in seconds (> 0).
   */
  horizonSecs: number;
  /**
   * Price monitoring auction extension duration in seconds should the price
   * breach it's theoretical level over the specified horizon at the specified
   * probability level (> 0)
   */
  auctionExtensionSecs: number;
}

export interface marketDetail_market_priceMonitoringSettings_parameters {
  __typename: "PriceMonitoringParameters";
  /**
   * The list of triggers for this price monitoring
   */
  triggers:
    | marketDetail_market_priceMonitoringSettings_parameters_triggers[]
    | null;
}

export interface marketDetail_market_priceMonitoringSettings {
  __typename: "PriceMonitoringSettings";
  /**
   * How often (in seconds) the price monitoring bounds should be updated
   */
  updateFrequencySecs: number;
  /**
   * Specified a set of PriceMonitoringParameters to be use for price monitoring purposes
   */
  parameters: marketDetail_market_priceMonitoringSettings_parameters | null;
}

export interface marketDetail_market_data_market {
  __typename: "Market";
  /**
   * Market ID
   */
  id: string;
}

export interface marketDetail_market_data_priceMonitoringBounds_trigger {
  __typename: "PriceMonitoringTrigger";
  /**
   * Price monitoring projection horizon τ in seconds (> 0).
   */
  horizonSecs: number;
  /**
   * Price monitoring probability level p. (>0 and < 1)
   */
  probability: number;
  /**
   * Price monitoring auction extension duration in seconds should the price
   * breach it's theoretical level over the specified horizon at the specified
   * probability level (> 0)
   */
  auctionExtensionSecs: number;
}

export interface marketDetail_market_data_priceMonitoringBounds {
  __typename: "PriceMonitoringBounds";
  /**
   * Reference price used to calculate the valid price range
   */
  referencePrice: string;
  /**
   * Minimum price that isn't currently breaching the specified price monitoring trigger
   */
  minValidPrice: string;
  /**
   * Maximum price that isn't currently breaching the specified price monitoring trigger
   */
  maxValidPrice: string;
  /**
   * Price monitoring trigger associated with the bounds
   */
  trigger: marketDetail_market_data_priceMonitoringBounds_trigger;
}

export interface marketDetail_market_data {
  __typename: "MarketData";
  /**
   * market id of the associated mark price
   */
  market: marketDetail_market_data_market;
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
   * the highest price level on an order book for buy orders not including pegged orders.
   */
  bestStaticBidPrice: string;
  /**
   * the aggregated volume being offered at the best static bid price, excluding pegged orders
   */
  bestStaticBidVolume: string;
  /**
   * the lowest price level on an order book for offer orders not including pegged orders.
   */
  bestStaticOfferPrice: string;
  /**
   * the aggregated volume being offered at the best static offer price, excluding pegged orders.
   */
  bestStaticOfferVolume: string;
  /**
   * the sum of the size of all positions greater than 0.
   */
  openInterest: string;
  /**
   * what state the market is in (auction, continuous etc)
   */
  marketTradingMode: MarketTradingMode;
  /**
   * RFC3339Nano time at which the auction will stop (null if not in auction mode)
   */
  auctionEnd: string | null;
  /**
   * the mark price (actually an unsgined int)
   */
  markPrice: string;
  /**
   * the arithmetic average of the best bid price and best offer price.
   */
  midPrice: string;
  /**
   * RFC3339Nano time at which this market price was releavant
   */
  timestamp: string;
  /**
   * the amount of stake targeted for this market
   */
  targetStake: string | null;
  /**
   * the supplied stake for the market
   */
  suppliedStake: string | null;
  /**
   * the market value proxy
   */
  marketValueProxy: string;
  /**
   * what triggered an auction (if an auction was started)
   */
  trigger: AuctionTrigger;
  /**
   * indicative price if the auction ended now, 0 if not in auction mode
   */
  indicativePrice: string;
  /**
   * indicative volume if the auction ended now, 0 if not in auction mode
   */
  indicativeVolume: string;
  /**
   * A list of valid price ranges per associated trigger
   */
  priceMonitoringBounds:
    | marketDetail_market_data_priceMonitoringBounds[]
    | null;
}

export interface marketDetail_market_fees_factors {
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

export interface marketDetail_market_fees {
  __typename: "Fees";
  /**
   * The factors used to calculate the different fees
   */
  factors: marketDetail_market_fees_factors;
}

export interface marketDetail_market_tradableInstrument_instrument_metadata {
  __typename: "InstrumentMetadata";
  /**
   * An arbitrary list of tags to associated to associate to the Instrument (string list)
   */
  tags: string[] | null;
}

export interface marketDetail_market_tradableInstrument_instrument_product_settlementAsset {
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

export interface marketDetail_market_tradableInstrument_instrument_product {
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
  settlementAsset: marketDetail_market_tradableInstrument_instrument_product_settlementAsset;
}

export interface marketDetail_market_tradableInstrument_instrument {
  __typename: "Instrument";
  /**
   * Uniquely identify an instrument accrods all instruments available on Vega (string)
   */
  id: string;
  /**
   * A short non necessarily unique code used to easily describe the instrument (e.g: FX:BTCUSD/DEC18) (string)
   */
  code: string;
  /**
   * Full and fairly descriptive name for the instrument
   */
  name: string;
  /**
   * Metadata for this instrument
   */
  metadata: marketDetail_market_tradableInstrument_instrument_metadata;
  /**
   * A reference to or instance of a fully specified product, including all required product parameters for that product (Product union)
   */
  product: marketDetail_market_tradableInstrument_instrument_product;
}

export interface marketDetail_market_tradableInstrument_riskModel_LogNormalRiskModel_params {
  __typename: "LogNormalModelParams";
  /**
   * mu parameter
   */
  mu: number;
  /**
   * r parameter
   */
  r: number;
  /**
   * sigma parameter
   */
  sigma: number;
}

export interface marketDetail_market_tradableInstrument_riskModel_LogNormalRiskModel {
  __typename: "LogNormalRiskModel";
  /**
   * Lambda parameter of the risk model
   */
  riskAversionParameter: number;
  /**
   * Tau parameter of the risk model
   */
  tau: number;
  /**
   * Params for the log normal risk model
   */
  params: marketDetail_market_tradableInstrument_riskModel_LogNormalRiskModel_params;
}

export interface marketDetail_market_tradableInstrument_riskModel_SimpleRiskModel_params {
  __typename: "SimpleRiskModelParams";
  /**
   * Risk factor for long
   */
  factorLong: number;
  /**
   * Risk factor for short
   */
  factorShort: number;
}

export interface marketDetail_market_tradableInstrument_riskModel_SimpleRiskModel {
  __typename: "SimpleRiskModel";
  /**
   * Params for the simple risk model
   */
  params: marketDetail_market_tradableInstrument_riskModel_SimpleRiskModel_params;
}

export type marketDetail_market_tradableInstrument_riskModel =
  | marketDetail_market_tradableInstrument_riskModel_LogNormalRiskModel
  | marketDetail_market_tradableInstrument_riskModel_SimpleRiskModel;

export interface marketDetail_market_tradableInstrument {
  __typename: "TradableInstrument";
  /**
   * An instance of or reference to a fully specified instrument.
   */
  instrument: marketDetail_market_tradableInstrument_instrument;
  /**
   * A reference to a risk model that is valid for the instrument
   */
  riskModel: marketDetail_market_tradableInstrument_riskModel;
}

export interface marketDetail_market_accounts {
  __typename: "Account";
  /**
   * Account type (General, Margin, etc)
   */
  type: AccountType;
  /**
   * Balance as string - current account balance (approx. as balances can be updated several times per second)
   */
  balance: string;
}

export interface marketDetail_market_liquidityMonitoringParameters_targetStakeParameters {
  __typename: "TargetStakeParameters";
  /**
   * Specifies scaling factors used in target stake calculation
   */
  scalingFactor: number;
}

export interface marketDetail_market_liquidityMonitoringParameters {
  __typename: "LiquidityMonitoringParameters";
  /**
   * Specifies the triggering ratio for entering liquidity auction
   */
  triggeringRatio: number;
  /**
   * Specifies parameters related to target stake calculation
   */
  targetStakeParameters: marketDetail_market_liquidityMonitoringParameters_targetStakeParameters;
}

export interface marketDetail_market {
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
   * Current state of the market
   */
  state: MarketState;
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
   * Definitions and required configuration for the trading mode
   */
  tradingModeConfig: marketDetail_market_tradingModeConfig;
  /**
   * Price monitoring settings for the market
   */
  priceMonitoringSettings: marketDetail_market_priceMonitoringSettings;
  /**
   * marketData for the given market
   */
  data: marketDetail_market_data;
  /**
   * Fees related data
   */
  fees: marketDetail_market_fees;
  /**
   * An instance of or reference to a tradable instrument.
   */
  tradableInstrument: marketDetail_market_tradableInstrument;
  /**
   * Get account for a party or market
   */
  accounts: marketDetail_market_accounts[] | null;
  /**
   * Liquidity monitoring parameters for the market
   */
  liquidityMonitoringParameters: marketDetail_market_liquidityMonitoringParameters;
}

export interface marketDetail {
  /**
   * An instrument that is trading on the VEGA network
   */
  market: marketDetail_market | null;
}

export interface marketDetailVariables {
  id: string;
}
