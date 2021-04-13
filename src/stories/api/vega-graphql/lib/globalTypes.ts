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
