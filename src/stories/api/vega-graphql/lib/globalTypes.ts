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
 * What market trading mode are we in
 */
export enum MarketTradingMode {
  BATCH_AUCTION = "BATCH_AUCTION",
  CONTINUOUS = "CONTINUOUS",
  MONITORING_AUCTION = "MONITORING_AUCTION",
  OPENING_AUCTION = "OPENING_AUCTION",
}

/**
 * Whether the placer of an order is aiming to buy or sell on the market
 */
export enum Side {
  Buy = "Buy",
  Sell = "Sell",
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

export enum OrderType {
  Limit = "Limit",
  Market = "Market",
  Network = "Network",
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
  NonPersistentOrderExceedsPriceBounds = "NonPersistentOrderExceedsPriceBounds",
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

export enum PendingAction {
  Cancel = "Cancel",
  None = "None",
  Submit = "Submit",
}

/**
 * Valid references used for pegged orders.
 */
export enum PeggedReference {
  BestAsk = "BestAsk",
  BestBid = "BestBid",
  Mid = "Mid",
}
