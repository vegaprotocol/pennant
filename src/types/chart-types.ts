export const chartTypes = ["area", "candle", "line"] as const;
export type ChartType = typeof chartTypes[number];

export const overlays = [
  "bollinger",
  "envelope",
  "priceMonitoringBounds",
] as const;
export type Overlay = typeof overlays[number];

export const studies = ["eldarRay", "macd", "volume"] as const;
export type Study = typeof studies[number];

export interface ChartInterface {
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

  reset(): void;

  /**
   * Snapshot of chart as Blob
   */
  snapshot(): Promise<Blob | null>;
}
