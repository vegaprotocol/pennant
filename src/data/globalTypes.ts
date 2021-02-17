/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

//==============================================================
// START Enums and Input Objects
//==============================================================

/**
 * The various account types we have (used by collateral)
 */
export enum AccountType {
  Bond = "Bond",
  FeeInfrastructure = "FeeInfrastructure",
  FeeLiquidity = "FeeLiquidity",
  General = "General",
  Insurance = "Insurance",
  LockWithdraw = "LockWithdraw",
  Margin = "Margin",
  Settlement = "Settlement",
}

export enum AuctionTrigger {
  Batch = "Batch",
  Liquidity = "Liquidity",
  Opening = "Opening",
  Price = "Price",
  Unspecified = "Unspecified",
}

export enum BusEventType {
  Account = "Account",
  Asset = "Asset",
  Auction = "Auction",
  Deposit = "Deposit",
  LiquidityProvision = "LiquidityProvision",
  LossSocialization = "LossSocialization",
  MarginLevels = "MarginLevels",
  Market = "Market",
  MarketCreated = "MarketCreated",
  MarketData = "MarketData",
  MarketTick = "MarketTick",
  MarketUpdated = "MarketUpdated",
  NodeSignature = "NodeSignature",
  Order = "Order",
  Party = "Party",
  PositionResolution = "PositionResolution",
  Proposal = "Proposal",
  RiskFactor = "RiskFactor",
  SettleDistressed = "SettleDistressed",
  SettlePosition = "SettlePosition",
  TimeUpdate = "TimeUpdate",
  Trade = "Trade",
  TransferResponses = "TransferResponses",
  Vote = "Vote",
  Withdrawal = "Withdrawal",
}

/**
 * The status of a deposit
 */
export enum DepositStatus {
  Cancelled = "Cancelled",
  Finalized = "Finalized",
  Open = "Open",
}

/**
 * The interval for trade candles when subscribing via VEGA graphql, default is I15M
 */
export enum Interval {
  I15M = "I15M",
  I1D = "I1D",
  I1H = "I1H",
  I1M = "I1M",
  I5M = "I5M",
  I6H = "I6H",
}

/**
 * The current state of a market
 */
export enum MarketState {
  ACTIVE = "ACTIVE",
  CANCELLED = "CANCELLED",
  CLOSED = "CLOSED",
  PENDING = "PENDING",
  PROPOSED = "PROPOSED",
  REJECTED = "REJECTED",
  SETTLED = "SETTLED",
  SUSPENDED = "SUSPENDED",
  TRADING_TERMINATED = "TRADING_TERMINATED",
}

/**
 * What market trading mode are we in
 */
export enum MarketTradingMode {
  BATCH_AUCTION = "BATCH_AUCTION",
  CONTINUOUS = "CONTINUOUS",
  MONITORING_AUCTION = "MONITORING_AUCTION",
  OPENING_AUCTION = "OPENING_AUCTION",
}

/**
 * Reason for the order being rejected by the core node
 */
export enum OrderRejectionReason {
  AmendToGTTWithoutExpiryAt = "AmendToGTTWithoutExpiryAt",
  CannotAmendFromGFAOrGFN = "CannotAmendFromGFAOrGFN",
  CannotAmendPeggedOrderDetailsOnNonPeggedOrder = "CannotAmendPeggedOrderDetailsOnNonPeggedOrder",
  CannotAmendToFOKOrIOC = "CannotAmendToFOKOrIOC",
  CannotAmendToGFAOrGFN = "CannotAmendToGFAOrGFN",
  EditNotAllowed = "EditNotAllowed",
  ExpiryAtBeforeCreatedAt = "ExpiryAtBeforeCreatedAt",
  FOKOrderDuringAuction = "FOKOrderDuringAuction",
  GFAOrderDuringContinuousTrading = "GFAOrderDuringContinuousTrading",
  GFNOrderDuringAuction = "GFNOrderDuringAuction",
  GTCWithExpiryAtNotValid = "GTCWithExpiryAtNotValid",
  IOCOrderDuringAuction = "IOCOrderDuringAuction",
  InsufficientAssetBalance = "InsufficientAssetBalance",
  InsufficientFundsToPayFees = "InsufficientFundsToPayFees",
  InternalError = "InternalError",
  InvalidExpirationTime = "InvalidExpirationTime",
  InvalidMarketId = "InvalidMarketId",
  InvalidMarketType = "InvalidMarketType",
  InvalidOrderId = "InvalidOrderId",
  InvalidOrderReference = "InvalidOrderReference",
  InvalidPartyId = "InvalidPartyId",
  InvalidPersistence = "InvalidPersistence",
  InvalidRemainingSize = "InvalidRemainingSize",
  InvalidSize = "InvalidSize",
  InvalidTimeInForce = "InvalidTimeInForce",
  InvalidType = "InvalidType",
  MarginCheckFailed = "MarginCheckFailed",
  MarketClosed = "MarketClosed",
  MissingGeneralAccount = "MissingGeneralAccount",
  OrderAmendFailure = "OrderAmendFailure",
  OrderNotFound = "OrderNotFound",
  OrderOutOfSequence = "OrderOutOfSequence",
  OrderRemovalFailure = "OrderRemovalFailure",
  PeggedOrderBuyCannotReferenceBestAskPrice = "PeggedOrderBuyCannotReferenceBestAskPrice",
  PeggedOrderMustBeGTTOrGTC = "PeggedOrderMustBeGTTOrGTC",
  PeggedOrderMustBeLimitOrder = "PeggedOrderMustBeLimitOrder",
  PeggedOrderOffsetMustBeGreaterOrEqualToZero = "PeggedOrderOffsetMustBeGreaterOrEqualToZero",
  PeggedOrderOffsetMustBeGreaterThanZero = "PeggedOrderOffsetMustBeGreaterThanZero",
  PeggedOrderOffsetMustBeLessOrEqualToZero = "PeggedOrderOffsetMustBeLessOrEqualToZero",
  PeggedOrderOffsetMustBeLessThanZero = "PeggedOrderOffsetMustBeLessThanZero",
  PeggedOrderSellCannotReferenceBestBidPrice = "PeggedOrderSellCannotReferenceBestBidPrice",
  PeggedOrderWithoutReferencePrice = "PeggedOrderWithoutReferencePrice",
  SelfTrading = "SelfTrading",
  TimeFailure = "TimeFailure",
  UnableToAmendPeggedOrderPrice = "UnableToAmendPeggedOrderPrice",
  UnableToRepricePeggedOrder = "UnableToRepricePeggedOrder",
}

/**
 * Valid order statuses, these determine several states for an order that cannot be expressed with other fields in Order.
 */
export enum OrderStatus {
  Active = "Active",
  Cancelled = "Cancelled",
  Expired = "Expired",
  Filled = "Filled",
  Parked = "Parked",
  PartiallyFilled = "PartiallyFilled",
  Rejected = "Rejected",
  Stopped = "Stopped",
}

/**
 * Valid order types, these determine what happens when an order is added to the book
 */
export enum OrderTimeInForce {
  FOK = "FOK",
  GFA = "GFA",
  GFN = "GFN",
  GTC = "GTC",
  GTT = "GTT",
  IOC = "IOC",
}

export enum OrderType {
  LIMIT = "LIMIT",
  MARKET = "MARKET",
  NETWORK = "NETWORK",
}

/**
 * Valid references used for pegged orders.
 */
export enum PeggedReference {
  BestAsk = "BestAsk",
  BestBid = "BestBid",
  Mid = "Mid",
}

export enum PendingAction {
  Cancel = "Cancel",
  None = "None",
  Submit = "Submit",
}

/**
 * Reason for the proposal being rejected by the core node
 */
export enum ProposalRejectionReason {
  CloseTimeTooLate = "CloseTimeTooLate",
  CloseTimeTooSoon = "CloseTimeTooSoon",
  EnactTimeTooLate = "EnactTimeTooLate",
  EnactTimeTooSoon = "EnactTimeTooSoon",
  IncompatibleTimestamps = "IncompatibleTimestamps",
  InsufficientTokens = "InsufficientTokens",
  InvalidAsset = "InvalidAsset",
  InvalidFutureMaturityTimestamp = "InvalidFutureMaturityTimestamp",
  InvalidInstrumentSecurity = "InvalidInstrumentSecurity",
  MissingBuiltinAssetField = "MissingBuiltinAssetField",
  MissingERC20ContractAddress = "MissingERC20ContractAddress",
  NetworkParameterInvalidKey = "NetworkParameterInvalidKey",
  NetworkParameterInvalidValue = "NetworkParameterInvalidValue",
  NetworkParameterValidationFailed = "NetworkParameterValidationFailed",
  NoProduct = "NoProduct",
  NoRiskParameters = "NoRiskParameters",
  NoTradingMode = "NoTradingMode",
  NodeValidationFailed = "NodeValidationFailed",
  ProductMaturityIsPassed = "ProductMaturityIsPassed",
  UnsupportedProduct = "UnsupportedProduct",
  UnsupportedTradingMode = "UnsupportedTradingMode",
}

/**
 * Various states a proposal can transition through:
 * Open ->
 * - Passed -> Enacted.
 * - Rejected.
 * Proposal can enter Failed state from any other state.
 */
export enum ProposalState {
  Declined = "Declined",
  Enacted = "Enacted",
  Failed = "Failed",
  Open = "Open",
  Passed = "Passed",
  Rejected = "Rejected",
  WaitingForNodeVote = "WaitingForNodeVote",
}

/**
 * Whether the placer of an order is aiming to buy or sell on the market
 */
export enum Side {
  Buy = "Buy",
  Sell = "Sell",
}

export enum VoteValue {
  NO = "NO",
  YES = "YES",
}

/**
 * The status of a withdrawal
 */
export enum WithdrawalStatus {
  Cancelled = "Cancelled",
  Finalized = "Finalized",
  Open = "Open",
}

/**
 * A vega builtin asset, mostly for testing purpose
 */
export interface BuiltinAssetInput {
  name: string;
  symbol: string;
  totalSupply: string;
  decimals: number;
  maxFaucetAmountMint: string;
}

/**
 * A mode where Vega try to execute order as soon as they are received
 */
export interface ContinuousTradingInput {
  tickSize?: string | null;
}

/**
 * Frequent batch auctions trading mode
 */
export interface DiscreteTradingInput {
  duration: number;
  tickSize?: string | null;
}

/**
 * An asset originated from an Ethereum ERC20 Token
 */
export interface ERC20Input {
  contractAddress: string;
}

/**
 * ERC20 specific details to start a withdrawal
 */
export interface Erc20WithdrawalDetailsInput {
  receiverAddress: string;
}

/**
 * Future product configuration
 */
export interface FutureProductInput {
  maturity: string;
  settlementAsset: string;
  quoteName: string;
}

export interface InstrumentConfigurationInput {
  name: string;
  code: string;
  futureProduct?: FutureProductInput | null;
}

export interface LogNormalModelParamsInput {
  mu: number;
  r: number;
  sigma: number;
}

export interface LogNormalRiskModelInput {
  riskAversionParameter: number;
  tau: number;
  params: LogNormalModelParamsInput;
}

/**
 * Representation of a network parameter
 */
export interface NetworkParameterInput {
  key: string;
  value: string;
}

/**
 * A new asset to be added into vega
 */
export interface NewAssetInput {
  builtinAsset?: BuiltinAssetInput | null;
  erc20?: ERC20Input | null;
}

/**
 * Allows creating new markets on the network
 */
export interface NewMarketInput {
  instrument: InstrumentConfigurationInput;
  decimalPlaces: number;
  riskParameters: RiskParametersInput;
  metadata?: string[] | null;
  openingAuctionDurationSecs?: number | null;
  priceMonitoringParameters?: PriceMonitoringParametersInput | null;
  continuousTrading?: ContinuousTradingInput | null;
  discreteTrading?: DiscreteTradingInput | null;
}

/**
 * PriceMonitoringParameters holds a list of triggers
 */
export interface PriceMonitoringParametersInput {
  triggers?: PriceMonitoringTriggerInput[] | null;
}

/**
 * PriceMonitoringParameters holds together price projection horizon τ, probability level p, and auction extension duration
 */
export interface PriceMonitoringTriggerInput {
  horizonSecs: number;
  probability: number;
  auctionExtensionSecs: number;
}

/**
 * Proposal terms input. Only one kind of change is expected. Proposals with no changes or more than one will not be accepted.
 */
export interface ProposalTermsInput {
  closingDatetime: string;
  enactmentDatetime: string;
  newMarket?: NewMarketInput | null;
  updateMarket?: UpdateMarketInput | null;
  updateNetworkParameter?: UpdateNetworkParameterInput | null;
  newAsset?: NewAssetInput | null;
}

export interface RiskParametersInput {
  simple?: SimpleRiskModelParamsInput | null;
  logNormal?: LogNormalRiskModelInput | null;
}

export interface SimpleRiskModelParamsInput {
  factorLong: number;
  factorShort: number;
}

export interface UpdateMarketInput {
  marketId: string;
}

/**
 * Allows submitting a proposal for changing network parameters
 */
export interface UpdateNetworkParameterInput {
  networkParameter: NetworkParameterInput;
}

//==============================================================
// END Enums and Input Objects
//==============================================================
