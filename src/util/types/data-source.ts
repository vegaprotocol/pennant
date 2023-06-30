import { Annotation } from "./annotation";
import { Candle } from "./candle";
import { Interval } from "./interval";

export interface Configuration {
  decimalPlaces: number;
  supportedIntervals: Interval[];
  priceMonitoringBounds: any;
}

export interface DataSource {
  readonly decimalPlaces: number;
  readonly marketOpen?: Date;

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
    onSubscriptionData: (datum: Candle) => void
  ): void;

  /**
   * Used by the charting library to clean-up a subscription to streaming data.
   */
  unsubscribeData(): void;

  /**
   * Used by the charting library to create a subscription to streaming annotation data.
   */
  subscribeAnnotations?(
    onSubscriptionAnnotations: (annotations: Annotation[]) => void
  ): void;

  /**
   * Used by the charting library to clean-up a subscription to streaming annotation data.
   */
  unsubscribeAnnotations?(): void;
}
