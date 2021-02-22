import { Interval } from "../data/globalTypes";

export interface DataSource {
  query(interval: Interval, from: string, to: string): Promise<any>;
  subscribe(interval: Interval, onSubscriptionData: (data: any) => void): void;
  unsubscribe(): void;
}
