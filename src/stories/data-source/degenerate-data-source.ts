import { DataSource } from "@util/types";

import { Interval } from "../api/vega-graphql";

export class DegenerateDataSource implements DataSource {
  _decimalPlaces = 0;

  get decimalPlaces(): number {
    return this._decimalPlaces;
  }

  async onReady() {
    return Promise.resolve({
      decimalPlaces: this._decimalPlaces,
      supportedIntervals: [Interval.I1D, Interval.I1H, Interval.I1M],
      priceMonitoringBounds: {},
    });
  }

  async query(_interval: Interval, _from: string, _to: string) {
    return Promise.resolve([
      {
        date: new Date(2023, 1, 21, 10, 0),
        open: 100,
        close: 100,
        high: 100,
        low: 100,
        volume: 100,
      },
      {
        date: new Date(2023, 1, 21, 10, 5),
        open: 100,
        close: 100,
        high: 100,
        low: 100,
        volume: 100,
      },
      {
        date: new Date(2023, 1, 21, 10, 10),
        open: 100,
        close: 100,
        high: 100,
        low: 100,
        volume: 100,
      },
    ]);
  }

  subscribeData(
    _interval: Interval,
    _onSubscriptionData: (data: any) => void
  ) {}

  unsubscribeData() {}
}
