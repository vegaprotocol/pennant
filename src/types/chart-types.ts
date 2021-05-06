export const chartTypes = ["area", "candle", "line", "ohlc"] as const;
export type ChartType = typeof chartTypes[number];
export const chartTypeLabels: Record<ChartType, string> = {
  area: "Mountain",
  candle: "Candlestick",
  line: "Line",
  ohlc: "OHLC",
} as const;

export const overlays = [
  "bollinger",
  "envelope",
  "priceMonitoringBounds",
] as const;
export type Overlay = typeof overlays[number];
export const overlayLabels: Record<Overlay, string> = {
  bollinger: "Bollinger bands",
  envelope: "Envelope",
  priceMonitoringBounds: "Price monitoring bounds",
} as const;

export const studies = ["eldarRay", "macd", "volume"] as const;
export type Study = typeof studies[number];
export const studyLabels: Record<Study, string> = {
  eldarRay: "Eldar-ray",
  macd: "MACD",
  volume: "Volume",
} as const;

export type Viewport = {
  date: Date;
  intervalWidth: number;
};

export type Bounds = [Date, Date];

export interface ChartElement {
  /**
   * Changes the center of the chart by the given number of intervals.
   */
  panBy(n: number): void;

  /**
   * Changes the center of the chart to the most recent Date.
   */
  reset(): void;

  /**
   * Snapshot of chart as Blob
   */
  snapshot(): Promise<Blob | null>;

  /**
   * Increases the zoom of the chart by delta.
   */
  zoomIn(delta: number): void;

  /**
   * Decreases the zoom of the chart by delta.
   */
  zoomOut(delta: number): void;
}
