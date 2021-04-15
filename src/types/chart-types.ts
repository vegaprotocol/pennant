export const chartTypes = ["area", "candle", "line"] as const;
export type ChartType = typeof chartTypes[number];
export const chartTypeLabels: Record<ChartType, string> = {
  area: "Mountain",
  candle: "Candlestick",
  line: "Line",
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
  volume: "Volumne",
} as const;

export interface ChartElement {
  /**
   * Sets the viewport to contain the given bounds.
   */
  fitBounds(bounds: [Date, Date]): void;

  /**
   * Changes the center of the chart by the given number of Intervals.
   */
  panBy(n: number): void;

  /**
   * Changes the center of the chart to the given Date.
   */
  panTo(x: Date): void;

  /**
   * Changes the center of the chart to the most recent Date.
   */
  reset(): void;

  /**
   * Snapshot of chart as Blob
   */
  snapshot(): Promise<Blob | null>;
}
