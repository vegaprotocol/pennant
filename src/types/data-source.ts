import { Intent, LabelProps } from "../components/label";
import { Interval } from "../stories/api/vega-graphql";

export type LabelAnnotation = {
  type: "label";
  id: string;
  cells: {
    label: string;
    stroke?: boolean;
    fill?: boolean;
    onClick?: () => void;
  }[];
  intent: Intent;
  y: number;
};

export type Annotation = LabelAnnotation;

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
