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
