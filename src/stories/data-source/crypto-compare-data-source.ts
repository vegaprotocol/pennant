import { Candle, DataSource } from "@util/types";

import { Interval } from "../api/vega-graphql";

const API_KEY =
  "541aa2fde7a4ca90365d4ac19fabc0740bd190f106e3e53d8f2144a3b2bdc297";

const socket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`,
  "protocolOne",
);

export class CryptoCompareDataSource implements DataSource {
  get decimalPlaces(): number {
    return 2;
  }

  get positionDecimalPlaces(): number {
    return 0;
  }

  async onReady() {
    return Promise.resolve({
      decimalPlaces: this.decimalPlaces,
      supportedIntervals: [Interval.I1D, Interval.I1H, Interval.I1M],
    });
  }

  async query(interval: Interval, from: string, to: string): Promise<Candle[]> {
    const limit = 500;
    const toTs = Math.floor(new Date(to).getTime() / 1000);
    let resolution;

    switch (interval) {
      case Interval.I1D:
        resolution = "day";
        break;
      case Interval.I1H:
        resolution = "hour";
        break;
      case Interval.I1M:
        resolution = "minute";
        break;
      default:
        resolution = "minute";
    }

    const res = await fetch(
      `https://min-api.cryptocompare.com/data/v2/histo${resolution}?fsym=BTC&tsym=USD&limit=${limit}&toTs=${toTs}&api_key=${API_KEY}`,
    );

    const data = await res.json();

    return data.Data.Data.map((d: any) => ({
      date: new Date(d.time * 1000),
      open: d.open,
      close: d.close,
      high: d.high,
      low: d.low,
      volume: d.volumeto,
    }));
  }

  subscribeData(_interval: Interval, onSubscriptionData: (datum: any) => void) {
    socket.onopen = function onStreamOpen() {
      var subRequest = {
        action: "SubAdd",
        subs: ["24~CCCAGG~BTC~USD~m"],
      };

      socket.send(JSON.stringify(subRequest));
    };

    socket.onmessage = function onStreamMessage(message) {
      const data = JSON.parse(message.data);

      if (data.TYPE === "24") {
        const tick = {
          date: new Date(data.TS * 1000),
          open: data.OPEN,
          high: data.HIGH,
          low: data.LOW,
          close: data.CLOSE,
        };

        onSubscriptionData(tick);
      }
    };
  }

  unsubscribeData() {
    const subRequest = {
      action: "SubRemove",
      subs: ["24~CCCAGG~BTC~USD~m"],
    };

    socket.send(JSON.stringify(subRequest));
  }
}
