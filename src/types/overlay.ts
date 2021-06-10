export const overlays = [
  "bollinger",
  "envelope",
  "exponentialMovingAverage",
  "movingAverage",
  "priceMonitoringBounds",
] as const;

export type Overlay = typeof overlays[number];

export const overlayLabels: Record<Overlay, string> = {
  bollinger: "Bollinger bands",
  envelope: "Envelope",
  exponentialMovingAverage: "EMA",
  movingAverage: "Moving average",
  priceMonitoringBounds: "Price monitoring bounds",
} as const;
