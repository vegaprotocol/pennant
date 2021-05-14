export interface CandleDetails {
  /**
   * RFC3339Nano formatted date and time for the candle
   */
  datetime: string;
  /**
   * High price (uint64)
   */
  high: string;
  /**
   * Low price (uint64)
   */
  low: string;
  /**
   * Open price (uint64)
   */
  open: string;
  /**
   * Close price (uint64)
   */
  close: string;
  /**
   * Volume price (uint64)
   */
  volume: string;
}
