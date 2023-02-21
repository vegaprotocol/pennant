export const Overlay = {
  BOLLINGER: "bollinger",
  ENVELOPE: "envelope",
  EXPONENTIAL_MOVING_AVERAGE: "exponentialMovingAverage",
  MOVING_AVERAGE: "movingAverage",
  PRICE_MONITORING_BOUNDS: "priceMonitoringBounds",
} as const;

export type Overlay = (typeof Overlay)[keyof typeof Overlay];

export const overlayLabels: Record<Overlay, string> = {
  bollinger: "Bollinger bands",
  envelope: "Envelope",
  exponentialMovingAverage: "EMA",
  movingAverage: "Moving average",
  priceMonitoringBounds: "Price monitoring bounds",
} as const;
