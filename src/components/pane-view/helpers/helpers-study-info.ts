import { format as d3Format } from "d3-format";
import { format } from "date-fns";

import { DATE_FORMAT } from "../../../constants";

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
  {
    label: string;
    fields: {
      id: string;
      label: string;
      format?: (d: any, decimalPlaces?: number) => string;
      intent?: boolean;
    }[];
  }
> = {
  main: {
    label: "",
    fields: [
      { id: "date", label: "", format: (d) => format(d, DATE_FORMAT) },
      { id: "open", label: "O" },
      { id: "high", label: "H" },
      { id: "low", label: "L" },
      { id: "close", label: "C" },
      {
        id: "absoluteChange",
        label: "Change",
        format: (d, decimalPlaces) => {
          if (isNaN(d)) {
            return "-";
          }

          return d3Format(`+.${decimalPlaces}f`)(d);
        },
        intent: true,
      },
      {
        id: "percentageChange",
        label: "",
        format: (d) => {
          if (isNaN(d)) {
            return "-";
          }

          return `(${d3Format("+.2%")(d)})`;
        },
        intent: true,
      },
    ],
  },
  simple: {
    label: "",
    fields: [
      { id: "close", label: "" },
      {
        id: "percentageChangeData24",
        label: "",
        format: (d) => {
          if (isNaN(d)) {
            return "-";
          }

          return d3Format("+.2%")(d);
        },
        intent: true,
      },
    ],
  },
  bollinger: {
    label: "Bollinger",
    fields: [
      { id: "bollingerUpper", label: "Upper" },
      { id: "bollingerLower", label: "Lower" },
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
      { id: "envelopeUpper", label: "Upper" },
      { id: "envelopeLower", label: "Lower" },
    ],
  },
  exponentialMovingAverage: {
    label: "EMA",
    fields: [{ id: "exponentialMovingAverage", label: "" }],
  },
  forceIndex: {
    label: "Force index",
    fields: [{ id: "forceIndex", label: "" }],
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
    fields: [{ id: "relativeStrengthIndex", label: "" }],
  },
  volume: {
    label: "Volume",
    fields: [{ id: "volume", label: "" }],
  },
};

export function getIntent(
  field: {
    id: string;
    label: string;
    format?:
      | ((d: any, decimalPlaces?: number | undefined) => string)
      | undefined;
    intent?: boolean | undefined;
  },
  value: number
): "success" | "danger" | undefined {
  if (!field.intent || isNaN(value) || value === 0) {
    return undefined;
  }

  return value > 0 ? "success" : "danger";
}
