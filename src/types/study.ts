export const studies = [
  "eldarRay",
  "macd",
  "relativeStrengthIndex",
  "volume",
] as const;

export type Study = typeof studies[number];

export const studyLabels: Record<Study, string> = {
  eldarRay: "Eldar-ray",
  macd: "MACD",
  relativeStrengthIndex: "RSI",
  volume: "Volume",
} as const;
