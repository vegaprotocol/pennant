import { Interval } from "./globalTypes";

export interface candlesQuery_market_tradableInstrument_instrument {
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
   * A short non necessarily unique code used to easily describe the instrument (e.g: FX:BTCUSD/DEC18) (string)
   */
  code: string;
}

export interface candlesQuery_market_tradableInstrument {
  __typename: "TradableInstrument";
  /**
   * An instance of or reference to a fully specified instrument.
   */
  instrument: candlesQuery_market_tradableInstrument_instrument;
}

export interface candlesQuery_market_candles {
  /**
   * ISO-8601 RFC3339+Nano formatted data and time for the candle
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

export interface candlesQuery_market {
  __typename: "Market";
  /**
   * Market ID
   */
  id: string;
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
  tradableInstrument: candlesQuery_market_tradableInstrument;
  /**
   * Candles on a market, for the 'last' n candles, at 'interval' seconds as specified by params
   */
  candles: (candlesQuery_market_candles | null)[] | null;
}

export interface candlesQuery {
  /**
   * An instrument that is trading on the VEGA network
   */
  market: candlesQuery_market | null;
}

export interface candlesQueryVariables {
  marketId: string;
  interval: Interval;
  since: string;
}
