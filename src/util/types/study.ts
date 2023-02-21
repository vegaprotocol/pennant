export const Study = {
  ELDAR_RAY: "eldarRay",
  FORCE_INDEX: "forceIndex",
  MACD: "macd",
  RELATIVE_STRENGTH_INDEX: "relativeStrengthIndex",
  VOLUME: "volume",
} as const;

export type Study = (typeof Study)[keyof typeof Study];

export const studyLabels: Record<Study, string> = {
  eldarRay: "Eldar-ray",
  forceIndex: "Force index",
  macd: "MACD",
  relativeStrengthIndex: "RSI",
  volume: "Volume",
} as const;
