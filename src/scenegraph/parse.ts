import {
  BarElement,
  CandleElement,
  CrosshairElement,
  GridElement,
  LineElement,
  XAxisElement,
  XAxisTooltipElement,
  YAxisElement,
  YAxisTooltipElement,
} from "../elements";
import {
  Data,
  EncodeEntry,
  Mark,
  MarkDef,
  PositionalElement,
  Scenegraph,
  View,
} from "../types";

import { AreaElement } from "../elements/element-area";
import { Colors } from "../helpers";
import { RuleElement } from "../elements";
import { extent } from "d3-array";

const PADDING_INNER = 0.4;

function createElement(type: Mark, options: any): PositionalElement {
  if (type === "area") {
    return new AreaElement(options);
  } else if (type === "bar") {
    return new BarElement(options);
  } else if (type === "line") {
    return new LineElement(options);
  } else if (type === "rule") {
    return new RuleElement(options);
  }

  throw new Error(`Element type not recognized: ${type}`);
}

function getAreaConfig(
  data: any,
  x: string,
  y: string,
  y2: string,
  color: string | null
) {
  return {
    points: data.map((d: any) => [d[x], d[y]]),
    color: color,
  };
}

function getBarConfig(
  d: any,
  x: string,
  y: string,
  y2: string,
  width: number,
  fill: string | null,
  stroke: string | null
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

function getLineConfig(data: any, x: string, y: string, color: string | null) {
  return {
    points: data.map((d: any) => [d[x], d[y]]),
    color: color,
  };
}

function getRuleConfig(
  d: any,
  x: string,
  x2: string,
  y: string,
  y2: string,
  color: string | null
) {
  if (x === undefined) {
    return {
      x: null,
      x2: null,
      y: d[y],
      y2: y2 !== undefined ? d[y2] : null,
      color: color,
    };
  }

  if (y === undefined) {
    return {
      x: d[x],
      x2: x2 !== undefined ? d[x2] : null,
      y: null,
      y2: null,
      color: color,
    };
  }

  return {
    x: d[x],
    x2: x2 !== undefined ? d[x2] : null,
    y: d[y],
    y2: d[y2],
    color,
  };
}

export function compileLayer(
  data: Data,
  encoding: EncodeEntry,
  mark: MarkDef,
  candleWidth: number
) {
  let markType: Mark;
  let cfg = {};

  if (typeof mark === "object") {
    markType = mark.type;
  } else {
    markType = mark;
  }

  if (markType === "area") {
    cfg = getAreaConfig(
      data?.values,
      encoding.x?.field!,
      encoding.y?.field!,
      encoding.y2?.field!,
      getConditionalColor(encoding?.color)(null)
    );

    return [createElement("area", cfg)];
  } else if (markType === "line") {
    cfg = getLineConfig(
      data?.values,
      encoding.x?.field!,
      encoding.y?.field!,
      getConditionalColor(encoding?.color)(null)
    );

    return [createElement("line", cfg)];
  }

  return data?.values
    ?.map((d) => {
      let cfg = {};

      if (markType === "bar") {
        cfg = getBarConfig(
          d,
          encoding.x?.field!,
          encoding.y?.field!,
          encoding.y2?.field!,
          candleWidth,
          getConditionalColor(encoding.fill)(d),
          getConditionalColor(encoding.stroke)(d)
        );
      } else if (markType === "rule") {
        cfg = getRuleConfig(
          d,
          encoding.x?.field!,
          encoding.x2?.field!,
          encoding.y?.field!,
          encoding.y2?.field!,
          getConditionalColor(encoding?.color)(d)
        );
      }

      return createElement(markType ?? "bar", cfg);
    })
    .filter((d) => d.x !== undefined);
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

function extractYDomain(layer: View) {
  const mappedData = extractYEncodingFields(layer).flatMap(
    (field: any) =>
      (layer.data?.values?.map((d) => d[field]) as unknown) as number
  );

  const domain = extent(mappedData) as [number, number];
  const domainSize = Math.abs(domain[1] - domain[0]);

  // TO DO: Include zero if specified in specification
  return [domain[0] - domainSize * 0.1, domain[1] + domainSize * 0.2] as [
    number,
    number
  ];
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
  if (specification.length > 2) {
    console.warn(
      `Expected no more than 2 panels. Received ${specification.length}`
    );
  }

  return {
    panels: specification.map((panel) => {
      return {
        id: panel.name ?? "",
        data: parseLayer(panel, { values: data }, {}, candleWidth),
        originalData: panel.data?.values ?? [],
        grid: new GridElement(),
        axis: new YAxisElement(),
        crosshair: new CrosshairElement(),
        axisTooltip: new YAxisTooltipElement(decimalPlaces),
        yEncodingFields: extractYEncodingFields(panel),
        yDomain: extractYDomain(panel),
      };
    }),
    xAxis: {
      id: "x-axis",
      originalData: data,
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
  let color: (datum: any) => string | null;

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
    color = () => null;
  }

  return color;
}
