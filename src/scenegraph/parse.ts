import { Annotation, Scenegraph } from "../types";
import { BaseSpec, TopLevelSpec, isVConcatSpec } from "../vega-lite/spec";
import {
  CrosshairElement,
  DummyElement,
  GridElement,
  LabelAnnotationElement,
  XAxisElement,
  XAxisTooltipElement,
  YAxisAnnotationElement,
  YAxisElement,
  YAxisTooltipElement,
} from "../elements";
import { Mark, MarkDef } from "../vega-lite/mark";
import {
  createElement,
  getAreaConfig,
  getBarConfig,
  getConditionalColor,
  getLineConfig,
  getRuleConfig,
} from "../helpers";
import {
  indicatorBollingerBands,
  indicatorElderRay,
  indicatorEnvelope,
  indicatorMacd,
  indicatorMovingAverage,
} from "@d3fc/d3fc-technical-indicator";

import { Data } from "../vega-lite/data";
import { Encoding } from "../vega-lite/encoding";
import { Field } from "../vega-lite/channeldef";
import { OutputNode } from "../vega-lite/compile/data/dataflow";
import { TechnicalIndicatorTransformNode } from "../vega-lite/compile/data/technical-indicator";
import { calculateScales } from "../scales";
import { compile } from "../vega-lite/compile/compile";
import { extent } from "d3-array";

export function compileLayer(
  data: Data,
  encoding: Encoding<Field>,
  mark: Mark | MarkDef,
  candleWidth: number
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
      (mark as MarkDef)?.line?.color
    );

    return [createElement("area", cfg)];
  } else if (markType === "line") {
    cfg = getLineConfig(
      data?.values,
      encoding.x?.field!,
      encoding.y?.field!,
      (mark as MarkDef)?.color
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

      return createElement((markType as any) ?? "bar", cfg);
    })
    .filter((d) => d.x !== undefined);
}

export function parseLayer(
  layer: BaseSpec,
  data: Data,
  encoding: Encoding<Field>,
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

function extractYDomain(layer: BaseSpec, data: any[]) {
  const mappedData = extractYEncodingFields(layer).flatMap(
    (field: any) => (data.map((d: any) => d[field]) as unknown) as number
  );

  const domain = extent(mappedData) as [number, number];
  const domainSize = Math.abs(domain[1] - domain[0]);

  // TO DO: Include zero if specified in specification
  return [domain[0] - domainSize * 0.1, domain[1] + domainSize * 0.2] as [
    number,
    number
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
  decimalPlaces: number,
  annotations: Annotation[]
): Scenegraph | null {
  if (isVConcatSpec(specification) && specification.vconcat.length > 2) {
    console.warn(
      `Expected no more than 2 panels. Received ${specification.vconcat.length}`
    );
  }

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
            const indicatorData = indicatorBollingerBands()(
              data.map((d: any) => d[transform.on])
            );

            newData = newData.map((d, i) => ({ ...d, ...indicatorData[i] }));
          }
          break;
        case "eldarRay":
          {
            const indicatorData = indicatorElderRay()(data);

            newData = newData.map((d, i) => ({ ...d, ...indicatorData[i] }));
          }
          break;
        case "envelope":
          {
            const indicatorData = indicatorEnvelope()(
              data.map((d) => d[transform.on])
            );

            newData = newData.map((d, i) => ({ ...d, ...indicatorData[i] }));
          }
          break;
        case "movingAverage":
          {
            const indicatorData = indicatorMovingAverage()(
              data.map((d) => d[transform.on])
            );

            newData = newData.map((d, i) => ({
              ...d,
              movingAverage: indicatorData[i],
            }));
          }
          break;
        case "macd":
          {
            const indicatorData = indicatorMacd()(
              data.map((d) => d[transform.on])
            );

            newData = newData.map((d, i) => ({ ...d, ...indicatorData[i] }));
          }
          break;
      }
    }

    head = head.parent;
  }

  specification.data = { values: newData };

  return {
    panels: isVConcatSpec(specification)
      ? specification.vconcat.map((panel, panelIndex) => {
          return {
            id: panel.name ?? "",
            renderableElements: parseLayer(
              panel,
              { values: newData },
              specification.encoding ?? {},
              candleWidth
            ),
            bounds: calculateScales(
              panel,
              newData,
              extractYEncodingFields(panel)
            ),
            originalData: newData ?? [],
            grid: new GridElement(),
            axis: new YAxisElement(),
            crosshair: new CrosshairElement(),
            axisTooltip: new YAxisTooltipElement(decimalPlaces),
            annotations:
              panelIndex === 0
                ? [
                    new YAxisAnnotationElement(
                      newData[newData.length - 1].close,
                      decimalPlaces
                    ),
                  ]
                : [],
            labels:
              panelIndex === 0
                ? annotations.map(
                    (annotation) =>
                      new LabelAnnotationElement({
                        cells: annotation.cells,
                        intent: annotation.intent,
                        y: annotation.y,
                      })
                  )
                : [],
            yEncodingFields: extractYEncodingFields(panel),
            yDomain: extractYDomain(panel, newData), // FIXME: duplicate of bounds
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
            })
        ),
      ],
      axis: new XAxisElement(),
      axisTooltip: new XAxisTooltipElement(),
      yEncodingFields: [],
    },
  };
}
