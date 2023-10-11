import {
  indicatorBollingerBands,
  indicatorElderRay,
  indicatorEnvelope,
  indicatorExponentialMovingAverage,
  indicatorForceIndex,
  indicatorMacd,
  indicatorMovingAverage,
  indicatorRelativeStrengthIndex,
} from "@d3fc/d3fc-technical-indicator";
import {
  CrosshairElement,
  DummyElement,
  GridElement,
  LabelAnnotationElement,
  LabelAnnotationHtmlElement,
  XAxisElement,
  XAxisTooltipElement,
  YAxisAnnotationElement,
  YAxisElement,
  YAxisTooltipElement,
} from "@ui/elements";
import {
  calculateScales,
  createElement,
  getAreaConfig,
  getBarConfig,
  getConditionalColor,
  getLineConfig,
  getRuleConfig,
  getTickConfig,
} from "@util/misc";
import { Annotation, Candle, Scenegraph } from "@util/types";
import {
  BaseSpec,
  compile,
  Data,
  Encoding,
  Field,
  isVConcatSpec,
  Mark,
  MarkDef,
  OutputNode,
  TechnicalIndicatorTransformNode,
  TopLevelSpec,
} from "@util/vega-lite";
import { extent } from "d3-array";

import { Dimensions } from "../../feature/candlestick-chart/hooks";

function compileLayer(
  data: Data,
  encoding: Encoding<Field>,
  mark: Mark | MarkDef,
  candleWidth: number,
  dimensions: Dimensions,
  pixelsToTime: number,
) {
  let markType: string;
  let cfg = {};

  if (typeof mark === "object") {
    markType = mark.type;
  } else {
    markType = mark;
  }

  if (markType === "area" && typeof Mark === "object") {
    cfg = getAreaConfig(
      data?.values,
      encoding.x?.field!,
      encoding.y?.field!,
      encoding.y2?.field!,
      (mark as MarkDef)?.color,
      (mark as MarkDef)?.line?.color,
    );

    return [createElement("area", cfg)];
  } else if (markType === "line") {
    cfg = getLineConfig(
      data?.values,
      encoding.x?.field!,
      encoding.y?.field!,
      (mark as MarkDef)?.color,
    );

    return [createElement("line", cfg)];
  }

  return data?.values
    ?.map((d: any) => {
      let cfg = {};

      if (markType === "bar") {
        cfg = getBarConfig(
          d,
          encoding.x?.field!,
          encoding.y?.field!,
          encoding.y2?.field!,
          candleWidth,
          getConditionalColor(encoding.fill)(d),
          getConditionalColor(encoding.stroke)(d),
          (encoding.strokeWidth as any)?.value ?? dimensions.strokeWidth,
          dimensions.innerPadding,
          dimensions.maxPaddingInPixels,
          pixelsToTime,
        );
      } else if (markType === "rule") {
        cfg = getRuleConfig(
          d,
          encoding.x?.field!,
          encoding.x2?.field!,
          encoding.y?.field!,
          encoding.y2?.field!,
          getConditionalColor(encoding?.color)(d),
        );
      } else if (markType === "tick") {
        cfg = getTickConfig(
          d,
          encoding.x?.field!,
          encoding.y?.field!,
          candleWidth,
          getConditionalColor(encoding?.color)(d),
          (mark as MarkDef).orient ?? "left", // FIXME: Type this correctly
        );
      }

      return createElement((markType as any) ?? "bar", cfg);
    })
    .filter((d) => d.x !== undefined);
}

export function parseLayer(
  layer: BaseSpec,
  data: Data,
  encoding: Encoding<Field>,
  candleWidth: number,
  dimensions: Dimensions,
  pixelsToTime: number,
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
      compileLayer(
        layerData,
        layerEncoding,
        layer.mark,
        candleWidth,
        dimensions,
        pixelsToTime,
      ),
    );
  }

  if (layer?.layer) {
    for (const subLayer of layer.layer) {
      series.push(
        ...parseLayer(
          subLayer,
          layerData,
          layerEncoding,
          candleWidth,
          dimensions,
          pixelsToTime,
        ),
      );
    }
  }

  return series;
}

function extractYDomain(layer: BaseSpec, data: any[]) {
  const mappedData = extractYEncodingFields(layer).flatMap(
    (field: any) => data.map((d: any) => d[field]) as unknown as number,
  );

  const domain = extent(mappedData) as [number, number];
  const domainSize = Math.abs(domain[1] - domain[0]);

  // TO DO: Include zero if specified in specification
  return [domain[0] - domainSize * 0.1, domain[1] + domainSize * 0.2] as [
    number,
    number,
  ];
}

function extractYEncodingFields(layer: BaseSpec) {
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
 * @param specification
 * @param candleWidth
 * @param decimalPlaces
 */
export function parse(
  specification: TopLevelSpec,
  candleWidth: number,
  dimensions: Dimensions,
  pixelsToTime: number,
  decimalPlaces: number,
  annotations: Annotation[],
): Scenegraph | null {
  if (specification.data?.values.length === 0) {
    return null;
  }

  const data: any[] = specification?.data?.values ?? [];
  const model = compile(specification);
  const outputNode = model.component.data.outputNodes["data"];

  let head: OutputNode | null = outputNode;
  let newData = [...data];

  while (head !== null) {
    if (head instanceof TechnicalIndicatorTransformNode) {
      const transform = head.assemble();

      switch (transform.method) {
        case "bollinger":
          {
            const indicatorData = indicatorBollingerBands<Candle>().value(
              (datum) => datum.close,
            )(data);

            newData = newData.map((d, i) => ({
              ...d,
              bollingerUpper: indicatorData[i].upper,
              bollingerAverage: indicatorData[i].average,
              bollingerLower: indicatorData[i].lower,
            }));
          }
          break;
        case "eldarRay":
          {
            const indicatorData = indicatorElderRay<Candle>()(data);

            newData = newData.map((d, i) => ({ ...d, ...indicatorData[i] }));
          }
          break;
        case "envelope":
          {
            const indicatorData = indicatorEnvelope<Candle>().value(
              (datum) => datum.close,
            )(data);

            newData = newData.map((d, i) => ({
              ...d,
              envelopeUpper: indicatorData[i].upper,
              envelopeLower: indicatorData[i].lower,
            }));
          }
          break;
        case "exponentialMovingAverage":
          {
            const indicatorData =
              indicatorExponentialMovingAverage<Candle>().value(
                (datum) => datum.close,
              )(data);

            newData = newData.map((d, i) => ({
              ...d,
              exponentialMovingAverage: indicatorData[i],
            }));
          }
          break;
        case "forceIndex":
          {
            const indicatorData = indicatorForceIndex<Candle>()(data);

            newData = newData.map((d, i) => ({
              ...d,
              forceIndex: indicatorData[i],
            }));
          }
          break;
        case "movingAverage":
          {
            const indicatorData = indicatorMovingAverage<Candle>().value(
              (datum) => datum.close,
            )(data);

            newData = newData.map((d, i) => ({
              ...d,
              movingAverage: indicatorData[i],
            }));
          }
          break;
        case "macd":
          {
            const indicatorData = indicatorMacd<Candle>().value(
              (datum) => datum.close,
            )(data);

            newData = newData.map((d, i) => ({ ...d, ...indicatorData[i] }));
          }
          break;
        case "relativeStrengthIndex":
          {
            const indicatorData =
              indicatorRelativeStrengthIndex<Candle>().value(
                (datum) => datum.close,
              )(data);

            newData = newData.map((d, i) => ({
              ...d,
              relativeStrengthIndex: indicatorData[i],
            }));
          }
          break;
        case "volume":
          {
            // no-op as volume is already present in the data
          }
          break;
      }
    }

    head = head.parent;
  }

  specification.data = { values: newData };

  return {
    panes: isVConcatSpec(specification)
      ? specification.vconcat.map((pane, paneIndex) => {
          return {
            id: pane.name ?? "",
            renderableElements: parseLayer(
              pane,
              { values: newData },
              specification.encoding ?? {},
              candleWidth,
              dimensions,
              pixelsToTime,
            ),
            bounds: calculateScales(
              pane,
              newData,
              extractYEncodingFields(pane),
            ),
            originalData: newData ?? [],
            grid: new GridElement(),
            axis: new YAxisElement(),
            crosshair: new CrosshairElement(),
            axisTooltip: new YAxisTooltipElement(decimalPlaces),
            annotations:
              paneIndex === 0
                ? [
                    new YAxisAnnotationElement(
                      newData[newData.length - 1].close,
                      decimalPlaces,
                    ),
                  ]
                : [],
            labels:
              paneIndex === 0
                ? [
                    new LabelAnnotationHtmlElement({
                      labels: annotations,
                    }),
                  ]
                : [],
            labelLines:
              paneIndex === 0
                ? [
                    new LabelAnnotationElement({
                      labels: annotations,
                    }),
                  ]
                : [],
            yEncodingFields: extractYEncodingFields(pane),
            yDomain: extractYDomain(pane, newData), // FIXME: duplicate of bounds
          };
        })
      : [], // FIXME: If not a vconcat spec what should we do?
    xAxis: {
      id: "x-axis",
      originalData: data,
      renderableElements: [
        data.map(
          (d) =>
            new DummyElement({
              x: d.date,
            }),
        ),
      ],
      axis: new XAxisElement(),
      axisTooltip: new XAxisTooltipElement(),
      yEncodingFields: [],
    },
  };
}
