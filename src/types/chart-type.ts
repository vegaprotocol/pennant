export const chartTypes = ["area", "candle", "line", "ohlc"] as const;

export type ChartType = typeof chartTypes[number];

export const chartTypeLabels: Record<ChartType, string> = {
  area: "Mountain",
  candle: "Candlestick",
  line: "Line",
  ohlc: "OHLC",
} as const;
