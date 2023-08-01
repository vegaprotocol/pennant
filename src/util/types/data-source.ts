import { Annotation } from "./annotation";
import { Candle } from "./candle";
import { Interval } from "./interval";
import { PriceMonitoringBounds } from "./price-monitoring-bounds";

export interface Configuration {
  decimalPlaces: number;
  supportedIntervals: Interval[];
  priceMonitoringBounds?: PriceMonitoringBounds[];
}

export interface DataSource {
  /**
   * Decimal places used for the market, sets the smallest price increment on the book.
   */
  readonly decimalPlaces: number;

  /**
   * Decimal places for order sizes, sets what size the smallest order / position on the market can be.
   */
  readonly positionDecimalPlaces: number;

  /**
   * Used by the charting library to initialize itself.
   */
  onReady(): Promise<Configuration>;

  /**
   * Used by the charting library to get historical data.
   */
  query(interval: Interval, from: string, to: string): Promise<Candle[]>;

  /**
   * Used by the charting library to create a subscription to streaming data.
   */
  subscribeData(
    interval: Interval,
    onSubscriptionData: (datum: Candle) => void,
  ): void;

  /**
   * Used by the charting library to clean-up a subscription to streaming data.
   */
  unsubscribeData(): void;

  /**
   * Used by the charting library to create a subscription to streaming annotation data.
   */
  subscribeAnnotations?(
    onSubscriptionAnnotations: (annotations: Annotation[]) => void,
  ): void;

  /**
   * Used by the charting library to clean-up a subscription to streaming annotation data.
   */
  unsubscribeAnnotations?(): void;
}
