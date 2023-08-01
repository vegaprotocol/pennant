import { DATE_FORMAT } from "@util/constants";
import { format as d3Format } from "d3-format";
import { format } from "date-fns";

export function getStudyInfoFieldValue(
  data: any[],
  index: number | null,
  id: string,
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
      /** Should still be displayed when no trading occurs */
      displayWhileNoTrading?: boolean;
    }[];
  }
> = {
  main: {
    label: "",
    fields: [
      {
        id: "date",
        label: "",
        format: (d) => format(d, DATE_FORMAT),
        displayWhileNoTrading: true,
      },
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
  priceMonitoringBounds1: {
    label: "Price Monitoring Bounds 1",
    fields: [
      { id: "minValidPrice_1", label: "Min" },
      { id: "maxValidPrice_1", label: "Max" },
      { id: "referencePrice_1", label: "Reference" },
    ],
  },
  priceMonitoringBounds2: {
    label: "Price Monitoring Bounds 2",
    fields: [
      { id: "minValidPrice_2", label: "Min" },
      { id: "maxValidPrice_2", label: "Max" },
      { id: "referencePrice_2", label: "Reference" },
    ],
  },
  priceMonitoringBounds3: {
    label: "Price Monitoring Bounds 3",
    fields: [
      { id: "minValidPrice_3", label: "Min" },
      { id: "maxValidPrice_3", label: "Max" },
      { id: "referencePrice_3", label: "Reference" },
    ],
  },
  priceMonitoringBounds4: {
    label: "Price Monitoring Bounds 4",
    fields: [
      { id: "minValidPrice_4", label: "Min" },
      { id: "maxValidPrice_4", label: "Max" },
      { id: "referencePrice_4", label: "Reference" },
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
  value: number,
): "success" | "danger" | undefined {
  if (!field.intent || isNaN(value) || value === 0) {
    return undefined;
  }

  return value > 0 ? "success" : "danger";
}
