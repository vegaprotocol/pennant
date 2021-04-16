import { Annotation } from ".";
import { Interval } from "../stories/api/vega-graphql";

export interface DataSource {
  readonly decimalPlaces: number;
  onReady(): Promise<{
    decimalPlaces: number;
    supportedIntervals: Interval[];
    priceMonitoringBounds: any;
  }>;
  query(interval: Interval, from: string, to: string): Promise<any>;
  subscribeData(
    interval: Interval,
    onSubscriptionData: (datum: any) => void
  ): void;
  unsubscribeData(): void;
  subscribeAnnotations?(
    onSubscriptionAnnotations: (annotations: Annotation[]) => void
  ): void;
  unsubscribeAnnotations?(): void;
}
