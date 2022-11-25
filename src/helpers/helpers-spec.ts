import { Colors, getAccentColor } from "../components/chart/helpers";
import { Candle, ChartType, Overlay, Study } from "../types";
import { BaseSpec, TopLevelSpec } from "../vega-lite/spec";
import { Transform } from "../vega-lite/transform";
import {
  indicatorAbsoluteChange,
  indicatorPercentageChange,
} from "./helpers-technical-indicators";

function constructMainLayerSpec(
  chartType: ChartType,
  colors: Colors
): BaseSpec[] {
  switch (chartType) {
    case ChartType.AREA:
      return [
        {
          encoding: {
            y: { field: "close", type: "quantitative" },
          },
          mark: {
            type: "area",
            line: {
              color: "#009cff",
            },
            color: {
              gradient: "linear",
              stops: [
                {
                  offset: 0,
                  color: "#044e80",
                },
                {
                  offset: 1,
                  color: colors.backgroundSurface,
                },
              ],
            },
          },
        },
      ];
    case ChartType.LINE:
      return [
        {
          encoding: {
            y: { field: "close", type: "quantitative" },
          },
          mark: {
            type: "line",
            color: "#009cff",
          },
        },
      ];
    case ChartType.OHLC:
      return [
        {
          encoding: {
            y: { field: "low", type: "quantitative" },
            y2: { field: "high", type: "quantitative" },
            color: {
              condition: {
                test: { field: "open", lt: "close" },
                value: colors.buyStroke,
              },
              value: colors.sellStroke,
            },
          },
          mark: {
            type: "rule",
          },
        },
        {
          encoding: {
            y: { field: "open", type: "quantitative" },
            color: {
              condition: {
                test: { field: "open", lt: "close" },
                value: colors.buyStroke,
              },
              value: colors.sellStroke,
            },
          },
          mark: {
            type: "tick",
            orient: "left",
          },
        },
        {
          encoding: {
            y: { field: "close", type: "quantitative" },
            color: {
              condition: {
                test: { field: "open", lt: "close" },
                value: colors.buyStroke,
              },
              value: colors.sellStroke,
            },
          },
          mark: {
            type: "tick",
            orient: "right",
          },
        },
      ];
    case ChartType.CANDLE:
      return [
        {
          encoding: {
            y: { field: "low", type: "quantitative" },
            y2: { field: "high", type: "quantitative" },
            color: {
              condition: {
                test: { field: "open", lt: "close" },
                value: colors.buyStroke,
              },
              value: colors.sellStroke,
            },
          },
          mark: {
            type: "rule",
          },
        },
        {
          encoding: {
            y: { field: "open", type: "quantitative" },
            y2: { field: "close", type: "quantitative" },
            fill: {
              condition: {
                test: { field: "open", lt: "close" },
                value: colors.buyFill,
              },
              value: colors.sellStroke,
            },
            stroke: {
              condition: {
                test: { field: "open", lt: "close" },
                value: colors.buyStroke,
              },
              value: colors.sellStroke,
            },
          },
          mark: {
            type: "bar",
          },
        },
      ];
  }
}

function constructStudyLayerSpec(study: Study, colors: Colors): BaseSpec[] {
  switch (study) {
    case "eldarRay":
      return [
        {
          encoding: {
            y: { field: "bullPower", type: "quantitative" },
            fill: { value: "green" },
          },
          mark: {
            type: "bar",
          },
        },
        {
          encoding: {
            y: { field: "bearPower", type: "quantitative" },
            fill: { value: "red" },
          },
          mark: {
            type: "bar",
          },
        },
      ];
    case "forceIndex":
      return [
        {
          encoding: {
            y: { field: "forceIndex", type: "quantitative" },
          },
          mark: {
            type: "line",
            color: colors.accent1,
          },
        },
      ];
    case "macd":
      return [
        {
          encoding: {
            y: { field: "divergence", type: "quantitative" },
            fill: {
              condition: {
                test: { field: "divergence", gt: 0 },
                value: colors.buyFill,
              },
              value: colors.sellFill,
            },
          },
          mark: {
            type: "bar",
          },
        },
        {
          encoding: {
            y: { field: "signal", type: "quantitative" },
          },
          mark: {
            type: "line",
            color: colors.vegaOrange,
          },
        },
        {
          encoding: {
            y: { field: "macd", type: "quantitative" },
          },
          mark: {
            type: "line",
            color: "#009cff",
          },
        },
      ];
    case "relativeStrengthIndex":
      return [
        {
          encoding: {
            y: { field: "relativeStrengthIndex", type: "quantitative" },
          },
          mark: {
            type: "line",
            color: colors.accent1,
          },
        },
      ];
    case "volume":
      return [
        {
          encoding: {
            y: { field: "volume", type: "quantitative" },
            fill: { value: colors.emphasis400 },
          },
          mark: {
            type: "bar",
          },
        },
      ];
    default:
      return [];
  }
}

function constructOverlayTransform(overlay: Overlay): Transform[] {
  switch (overlay) {
    case "bollinger":
      return [
        {
          indicator: "bollinger",
          on: ["close"],
          as: ["bollingerUpper", "bollingerAverage", "bollingerLower"],
        },
      ];
    case "envelope":
      return [
        {
          indicator: "envelope",
          on: ["close"],
          as: ["envelopeUpper", "envelopeLower"],
        },
      ];
    case "exponentialMovingAverage":
      return [
        {
          indicator: "exponentialMovingAverage",
          on: ["close"],
          as: ["exponentialMovingAverage"],
        },
      ];
    case "movingAverage":
      return [
        {
          indicator: "movingAverage",
          on: ["close"],
          as: ["movingAverage"],
        },
      ];
    default:
      return [];
  }
}

function constructStudyTransform(study: Study): Transform[] {
  switch (study) {
    case "eldarRay":
      return [
        {
          indicator: "eldarRay",
          on: ["close", "high", "low"],
          as: ["bullPower", "bearPower"],
        },
      ];
    case "forceIndex":
      return [
        {
          indicator: "forceIndex",
          on: ["close", "volume"],
          as: ["forceIndex"],
        },
      ];
    case "macd":
      return [
        {
          indicator: "macd",
          on: ["close"],
          as: ["macd", "signal", "divergence"],
        },
      ];
    case "relativeStrengthIndex":
      return [
        {
          indicator: "relativeStrengthIndex",
          on: ["close"],
          as: ["relativeStrengthIndex"],
        },
      ];
    default:
      return []; // TODO: Can we remove this if we add a volume indicator (basically an identity function)
  }
}

export function constructTopLevelSpec(
  data: Candle[],
  chartType: ChartType,
  colors: Colors,
  overlays?: Overlay[],
  studies?: Study[],
  priceMonitoringBounds?: any
) {
  const vconcat: BaseSpec[] = [];
  const transform: Transform[] = [];

  let colorIndex = 0;

  function constructOverlayLayerSpec(overlay: Overlay): BaseSpec[] {
    switch (overlay) {
      case "bollinger":
        return [
          {
            encoding: {
              y: { field: "bollingerLower", type: "quantitative" },
            },
            mark: {
              type: "line",
              color: colors[getAccentColor(colorIndex++)],
            },
          },
          {
            encoding: {
              y: { field: "bollingerUpper", type: "quantitative" },
            },
            mark: {
              type: "line",
              color: colors[getAccentColor(colorIndex++)],
            },
          },
        ];
      case "envelope":
        return [
          {
            encoding: {
              y: { field: "envelopeLower", type: "quantitative" },
            },
            mark: {
              type: "line",
              color: colors[getAccentColor(colorIndex++)],
            },
          },
          {
            encoding: {
              y: { field: "envelopeUpper", type: "quantitative" },
            },
            mark: {
              type: "line",
              color: colors[getAccentColor(colorIndex++)],
            },
          },
        ];
      case "exponentialMovingAverage":
        return [
          {
            encoding: {
              y: { field: "exponentialMovingAverage", type: "quantitative" },
            },
            mark: {
              type: "line",
              color: colors[getAccentColor(colorIndex++)],
            },
          },
        ];
      case "movingAverage":
        return [
          {
            encoding: {
              y: { field: "movingAverage", type: "quantitative" },
            },
            mark: {
              type: "line",
              color: colors[getAccentColor(colorIndex++)],
            },
          },
        ];
      case "priceMonitoringBounds":
        return [
          {
            encoding: {
              y: { field: "minValidPrice", type: "quantitative" },
            },
            mark: {
              type: "line",
              color: colors[getAccentColor(colorIndex++)],
            },
          },
          {
            encoding: {
              y: { field: "maxValidPrice", type: "quantitative" },
            },
            mark: {
              type: "line",
              color: colors[getAccentColor(colorIndex++)],
            },
          },
          {
            encoding: {
              y: { field: "referencePrice", type: "quantitative" },
            },
            mark: {
              type: "line",
              color: colors[getAccentColor(colorIndex++)],
            },
          },
        ];
      default:
        return [];
    }
  }

  const mainSpecification: BaseSpec = {
    name: "main",
    layer: constructMainLayerSpec(chartType, colors),
  };

  if (overlays && overlays.length) {
    for (const overlay of overlays) {
      transform.push(...constructOverlayTransform(overlay));
      mainSpecification.layer?.push(...constructOverlayLayerSpec(overlay));
    }
  }

  vconcat.push(mainSpecification);

  if (studies && studies.length > 0) {
    for (const study of studies) {
      transform.push(...constructStudyTransform(study));

      const studySpecification: BaseSpec = {
        name: study,
        layer: constructStudyLayerSpec(study, colors),
      };

      vconcat.push(studySpecification);
    }
  }

  // Calculate change
  const percentageChangeData = indicatorPercentageChange().period(2)(
    data.map((d) => d.close)
  );

  const percentageChangeData24 = indicatorPercentageChange().period(25)(
    data.map((d) => d.close)
  );

  const absoluteChangeData = indicatorAbsoluteChange().period(2)(
    data.map((d) => d.close)
  );

  data = data.map((d, i) => ({
    ...d,
    percentageChange: percentageChangeData[i],
    percentageChangeData24: percentageChangeData24[i],
    absoluteChange: absoluteChangeData[i],
  }));

  if (priceMonitoringBounds) {
    data = data.map((d) => ({
      ...d,
      maxValidPrice: priceMonitoringBounds.maxValidPrice,
      minValidPrice: priceMonitoringBounds.minValidPrice,
      referencePrice: priceMonitoringBounds.referencePrice,
    }));
  }

  const topLevelSpec: TopLevelSpec = {
    data: { values: data },
    transform: transform,
    encoding: {
      x: { field: "date", type: "temporal" },
    },
    vconcat: vconcat,
  };

  return topLevelSpec;
}

export function constructTopLevelSpecV2(
  data: Candle[],
  chartType: ChartType,
  colors: Colors,
  overlays?: Overlay[],
  studies?: Study[],
  priceMonitoringBounds?: any
) {
  const vconcat: BaseSpec[] = [];
  const transform: Transform[] = [];

  const mainSpecification: BaseSpec = {
    name: "main",
    layer: constructMainLayerSpec(chartType, colors),
  };

  if (overlays && overlays.length) {
    for (const overlay of overlays) {
      transform.push(...constructOverlayTransform(overlay));
      mainSpecification.layer?.push(
        ...constructOverlayLayerSpec(overlay, colors)
      );
    }
  }

  vconcat.push(mainSpecification);

  if (studies && studies.length > 0) {
    for (const study of studies) {
      transform.push(...constructStudyTransform(study));

      const studySpecification: BaseSpec = {
        name: study,
        layer: constructStudyLayerSpec(study, colors),
      };

      vconcat.push(studySpecification);
    }
  }

  // Calculate change
  const percentageChangeData = indicatorPercentageChange().period(2)(
    data.map((d) => d.close)
  );

  const percentageChangeData24 = indicatorPercentageChange().period(25)(
    data.map((d) => d.close)
  );

  const absoluteChangeData = indicatorAbsoluteChange().period(2)(
    data.map((d) => d.close)
  );

  data = data.map((d, i) => ({
    ...d,
    percentageChange: percentageChangeData[i],
    percentageChangeData24: percentageChangeData24[i],
    absoluteChange: absoluteChangeData[i],
  }));

  if (priceMonitoringBounds) {
    data = data.map((d) => ({
      ...d,
      maxValidPrice: priceMonitoringBounds.maxValidPrice,
      minValidPrice: priceMonitoringBounds.minValidPrice,
      referencePrice: priceMonitoringBounds.referencePrice,
    }));
  }

  const topLevelSpec: TopLevelSpec = {
    data: { values: data },
    transform: transform,
    encoding: {
      x: { field: "date", type: "temporal" },
    },
    vconcat: vconcat,
  };

  return topLevelSpec;
}
