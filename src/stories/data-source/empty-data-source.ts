import { DataSource } from "@util/types";

import { Interval } from "../api/vega-graphql";

export class EmptyDataSource implements DataSource {
  _decimalPlaces = 0;
  _positionDecimalPlaces = 0;

  get decimalPlaces(): number {
    return this._decimalPlaces;
  }

  get positionDecimalPlaces(): number {
    return this._positionDecimalPlaces;
  }

  async onReady() {
    return Promise.resolve({
      decimalPlaces: this._decimalPlaces,
      supportedIntervals: [Interval.I1D, Interval.I1H, Interval.I1M],
    });
  }

  async query(_interval: Interval, _from: string, _to: string) {
    return Promise.resolve([]);
  }

  subscribeData(
    _interval: Interval,
    _onSubscriptionData: (data: any) => void,
  ) {}

  unsubscribeData() {}
}
