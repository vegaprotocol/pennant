export const ChartType = {
  AREA: "area",
  CANDLE: "candle",
  LINE: "line",
  OHLC: "ohlc",
} as const;

export type ChartType = (typeof ChartType)[keyof typeof ChartType];

export const chartTypeLabels: Record<ChartType, string> = {
  area: "Mountain",
  candle: "Candlestick",
  line: "Line",
  ohlc: "OHLC",
} as const;
