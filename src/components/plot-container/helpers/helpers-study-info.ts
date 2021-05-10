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
  eldarRay: {
    label: "Eldar-ray",
    fields: [
      { id: "bullPower", label: "Bull" },
      { id: "bearPower", label: "Bear" },
    ],
  },
  macd: {
    label: "MACD",
    fields: [
      { id: "signal", label: "S" },
      { id: "divergence", label: "D" },
      { id: "macd", label: "MACD" },
    ],
  },
  volume: {
    label: "Volume",
    fields: [{ id: "volume", label: "V" }],
  },
};
