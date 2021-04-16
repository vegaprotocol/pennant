export type FieldName = string;

export interface TechnicalIndicatorTransform {
  indicator:
    | "bollinger"
    | "eldarRay"
    | "envelope"
    | "movingAverage"
    | "exponentialMovingAverage"
    | "forceIndex"
    | "macd"
    | "relativeStrengthIndex"
    | "stochasticOscillator";
  on: FieldName;
}

export type Transform = TechnicalIndicatorTransform;
