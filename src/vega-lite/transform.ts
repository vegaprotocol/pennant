type FieldName = string;

type Indicator =
  | "bollinger"
  | "eldarRay"
  | "envelope"
  | "exponentialMovingAverage"
  | "forceIndex"
  | "macd"
  | "movingAverage"
  | "relativeStrengthIndex"
  | "stochasticOscillator"
  | "volume";

export interface TechnicalIndicatorTransform {
  indicator: Indicator;
  on: FieldName[];
  as: FieldName[];
}

export type Transform = TechnicalIndicatorTransform;
