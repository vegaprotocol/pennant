export type Candle = {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number; // TODO: Should be optional
};
