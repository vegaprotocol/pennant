export type ChartType = "area" | "candle" | "line";
export type Overlay = "bollinger" | "envelope" | "priceMonitoringBounds";
export type Study = "eldarRay" | "macd" | "volume";

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
