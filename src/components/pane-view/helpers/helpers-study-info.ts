export function getStudyInfoFieldValue(
  data: any[],
  index: number | null,
  id: string
): number {
  const length = data.length;

  if (length === 0) {
    return NaN;
  }

  if (index === null || index >= length || index < 0) {
    return data[length - 1][id];
  }

  return data[index][id];
}

export const studyInfoFields: Record<
  string,
  { label: string; fields: { id: string; label: string }[] }
> = {
  main: {
    label: "Candle",
    fields: [
      { id: "open", label: "O" },
      { id: "high", label: "H" },
      { id: "low", label: "L" },
      { id: "close", label: "C" },
    ],
  },
  bollinger: {
    label: "Bollinger",
    fields: [
      { id: "upper", label: "Upper" },
      { id: "lower", label: "Lower" },
    ],
  },
  eldarRay: {
    label: "Eldar-ray",
    fields: [
      { id: "bullPower", label: "Bull" },
      { id: "bearPower", label: "Bear" },
    ],
  },
  envelope: {
    label: "Envelope",
    fields: [
      { id: "upper", label: "Upper" },
      { id: "lower", label: "Lower" },
    ],
  },
  exponentialMovingAverage: {
    label: "EMA",
    fields: [{ id: "movingAverage", label: "" }],
  },
  macd: {
    label: "MACD",
    fields: [
      { id: "signal", label: "S" },
      { id: "divergence", label: "D" },
      { id: "macd", label: "MACD" },
    ],
  },
  movingAverage: {
    label: "Moving average",
    fields: [{ id: "movingAverage", label: "" }],
  },
  priceMonitoringBounds: {
    label: "Price Monitoring Bounds",
    fields: [
      { id: "minValidPrice", label: "Min" },
      { id: "maxValidPrice", label: "Max" },
      { id: "referencePrice", label: "Reference" },
    ],
  },
  relativeStrengthIndex: {
    label: "RSI",
    fields: [{ id: "index", label: "" }],
  },
  volume: {
    label: "Volume",
    fields: [{ id: "volume", label: "" }],
  },
};
