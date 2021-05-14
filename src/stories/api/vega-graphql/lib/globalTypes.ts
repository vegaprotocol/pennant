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
