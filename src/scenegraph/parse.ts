import {
  BarElement,
  CandleElement,
  CrosshairElement,
  GridElement,
  XAxisElement,
  XAxisTooltipElement,
  YAxisElement,
  YAxisTooltipElement,
} from "../elements";
import {
  Data,
  EncodeEntry,
  Mark,
  PositionalElement,
  Scenegraph,
  View,
} from "../types";

import { Colors } from "../helpers";
import { LineElement } from "../elements";

const PADDING_INNER = 0.4;

function createElement(type: string, options: any): PositionalElement {
  if (type === "bar") {
    return new BarElement(options);
  } else if (type === "rule") {
    return new LineElement(options);
  }

  throw new Error(`Element type not recognized: ${type}`);
}

function getBarConfig(
  d: any,
  x: string,
  y: string,
  y2: string,
  width: number,
  fill: string,
  stroke: string
) {
  let base = 0;

  if (y2) {
    base = d[y2];
  }

  return {
    x: d[x],
    y: Math.max(d[y] as number, base),
    height: Math.abs(base - (d[y] as number)),
    width: width * (1 - PADDING_INNER),
    fill: fill,
    stroke: stroke,
  };
}

function getLineConfig(
  d: any,
  x: string,
  y: string,
  y2: string,
  color: string
) {
  if (!x && !y2) {
    return {
      points: [
        [null, d[y]],
        [null, d[y]],
      ],
      color: color,
    };
  }

  return {
    points: [
      [d[x], d[y]],
      [d[x], d[y2]],
    ],
    color: color,
  };
}

export function compileLayer(
  data: Data,
  encoding: EncodeEntry,
  mark: Mark,
  candleWidth: number
) {
  return data?.values?.map((d) => {
    let cfg = {};

    if (mark === "bar") {
      cfg = getBarConfig(
        d,
        encoding.x?.field!,
        encoding.y?.field!,
        encoding.y2?.field!,
        candleWidth,
        getConditionalColor(encoding.fill)(d),
        getConditionalColor(encoding.stroke)(d)
      );
    } else if (mark === "rule") {
      cfg = getLineConfig(
        d,
        encoding.x?.field!,
        encoding.y?.field!,
        encoding.y2?.field!,
        getConditionalColor(encoding?.color)(d)
      );
    }

    return createElement(mark ?? "bar", cfg);
  });
}

export function parseLayer(
  layer: View,
  data: Data,
  encoding: EncodeEntry,
  candleWidth: number
) {
  const series: any[] = [];
  let layerData = data;
  let layerEncoding = encoding;

  if (layer?.data) {
    layerData = layer.data;
  }

  if (layer?.encoding) {
    layerEncoding = { ...encoding, ...layer.encoding };
  }

  if (layer?.mark) {
    series.push(
      compileLayer(layerData, layerEncoding, layer.mark, candleWidth)
    );
  }

  if (layer?.layer) {
    for (const subLayer of layer.layer) {
      series.push(
        ...parseLayer(subLayer, layerData, layerEncoding, candleWidth)
      );
    }
  }

  return series;
}

function extractYEncodingFields(layer: View) {
  const yEncodingFields: string[] = [];

  if (layer?.encoding) {
    if (layer.encoding.y?.field) {
      yEncodingFields.push(layer.encoding.y.field);
    }

    if (layer.encoding.y2?.field) {
      yEncodingFields.push(layer.encoding.y2.field);
    }
  }

  if (layer?.layer) {
    for (const subLayer of layer.layer) {
      yEncodingFields.push(...extractYEncodingFields(subLayer));
    }
  }

  return yEncodingFields;
}

/**
 * Parse top-level view specification into a scenegraph model
 * @param data
 * @param specification
 * @param candleWidth
 * @param decimalPlaces
 */
export function parse(
  data: any[],
  specification: View[],
  candleWidth: number,
  decimalPlaces: number
): Scenegraph {
  return {
    panels: specification.map((panel) => {
      return {
        id: panel.name ?? "",
        data: parseLayer(panel, { values: data }, {}, candleWidth),
        grid: new GridElement(),
        axis: new YAxisElement(),
        crosshair: new CrosshairElement(),
        axisTooltip: new YAxisTooltipElement(decimalPlaces),
        yEncodingFields: extractYEncodingFields(panel),
      };
    }),
    xAxis: {
      id: "x-axis",
      data: [
        data.map(
          (candle) =>
            new CandleElement({
              ...candle,
              x: candle.date,
              width: candleWidth * (1 - PADDING_INNER),
            })
        ),
      ],
      axis: new XAxisElement(),
      axisTooltip: new XAxisTooltipElement(),
    },
  };
}

function getConditionalColor(
  encoding:
    | { condition?: { test: string[]; value: string }; value: string }
    | undefined
) {
  let color: (datum: any) => string;

  if (encoding?.condition?.test.length === 3) {
    const test = encoding?.condition?.test;

    const operator = test[0];
    const operand1 = test[1];
    const operand2 = test[2];

    switch (operator) {
      case "lt":
        color = (datum) =>
          datum[operand1] < datum[operand2]
            ? encoding?.condition?.value ?? Colors.GRAY
            : encoding?.value ?? Colors.GRAY;
        break;
      case "gt":
        color = (datum) =>
          datum[operand1] > datum[operand2]
            ? encoding?.condition?.value ?? Colors.GRAY
            : encoding?.value ?? Colors.GRAY;
        break;
      default:
        throw new Error(`Unrecognized condition operator: ${operator}`);
    }
  } else if (encoding?.value) {
    color = () => encoding.value;
  } else {
    color = () => Colors.GRAY;
  }

  return color;
}
