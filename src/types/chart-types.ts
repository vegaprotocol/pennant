export type Viewport = {
  date: Date;
  intervalWidth: number;
};

export type Bounds = [Date, Date];

export interface PlotContainerElement {
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

export interface PennantEvent {
  type: string;
}

export interface PennantMouseEvent extends PennantEvent {
  position: [number, number];
  price: number;
}

export type PennantEventHandlerFn = (event: PennantEvent) => void;
export type PennantMouseEventHandlerFn = (event: PennantMouseEvent) => void;

export interface ChartElement extends PlotContainerElement {
  /**
   * Adds a listener function (callback) to a particular event type of the object.
   */
  subscribe(type: string, callback: PennantEventHandlerFn): void;
  subscribe(type: "contextmenu", callback: PennantMouseEventHandlerFn): void;
}
