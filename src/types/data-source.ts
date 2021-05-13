import { Annotation, Candle, Interval } from ".";

export interface DataSource {
  readonly decimalPlaces: number;
  onReady(): Promise<{
    decimalPlaces: number;
    supportedIntervals: Interval[];
    priceMonitoringBounds: any;
  }>;
  query(interval: Interval, from: string, to: string): Promise<Candle[]>;
  subscribeData(
    interval: Interval,
    onSubscriptionData: (datum: Candle) => void
  ): void;
  unsubscribeData(): void;
  subscribeAnnotations?(
    onSubscriptionAnnotations: (annotations: Annotation[]) => void
  ): void;
  unsubscribeAnnotations?(): void;
}
