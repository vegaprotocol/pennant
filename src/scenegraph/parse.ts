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
  CandleDetailsExtended,
  PositionalElement,
  Scenegraph,
} from "../types/element";

import { Colors } from "../helpers";
import { LineElement } from "../elements/element-line";
import { View } from "../types/vega-spec-types";

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
  return {
    points: [
      [d[x], d[y]],
      [d[x], d[y2]],
    ],
    color: color,
  };
}

/**
 * Parse top-level view specification into a scenegraph model
 * @param data
 * @param specification
 * @param candleWidth
 * @param decimalPlaces
 */
export function parse(
  data: CandleDetailsExtended[],
  specification: View[],
  candleWidth: number,
  decimalPlaces: number
): Scenegraph {
  return {
    panels: specification.map((panel) => {
      return {
        id: panel.name ?? "",
        data: panel.layer
          ? panel.layer.map((layer) => {
              return data.map((d) => {
                let cfg = {};

                if (layer.mark === "bar") {
                  cfg = getBarConfig(
                    d,
                    panel.encoding.x?.field ?? "",
                    layer.encoding.y?.field ?? "",
                    layer.encoding.y2?.field ?? "",
                    candleWidth,
                    getConditionalColor(layer.encoding?.fill)(d),
                    getConditionalColor(layer.encoding?.stroke)(d)
                  );
                } else if (layer.mark === "rule") {
                  cfg = getLineConfig(
                    d,
                    panel.encoding.x?.field ?? "",
                    layer.encoding.y?.field ?? "",
                    layer.encoding.y2?.field ?? "",
                    getConditionalColor(panel.encoding?.color)(d)
                  );
                }

                return createElement(layer.mark ?? panel.mark ?? "bar", cfg);
              });
            })
          : [
              data.map((d) => {
                let cfg = {};

                if (panel.mark === "bar") {
                  cfg = getBarConfig(
                    d,
                    panel.encoding.x?.field ?? "",
                    panel.encoding.y?.field ?? "",
                    panel.encoding.y2?.field ?? "",
                    candleWidth,
                    getConditionalColor(panel.encoding?.fill)(d),
                    getConditionalColor(panel.encoding?.stroke)(d)
                  );
                }

                return createElement(panel?.mark ?? "bar", cfg);
              }),
            ],
        grid: new GridElement(),
        axis: new YAxisElement(),
        crosshair: new CrosshairElement(),
        axisTooltip: new YAxisTooltipElement(decimalPlaces),
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
    | { condition: { test: string[]; value: string }; value: string }
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
            ? encoding?.condition.value
            : encoding?.value ?? Colors.GRAY;
        break;
      case "gt":
        color = (datum) =>
          datum[operand1] > datum[operand2]
            ? encoding?.condition.value
            : encoding?.value ?? Colors.GRAY;
        break;
      default:
        throw new Error(`Unrecognized condition operator: ${operator}`);
    }
  } else {
    color = () => Colors.GRAY;
  }

  return color;
}
