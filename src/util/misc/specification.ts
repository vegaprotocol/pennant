import {
  Candle,
  ChartType,
  Overlay,
  PriceMonitoringBounds,
  Study,
} from "@util/types";
import { BaseSpec, TopLevelSpec, Transform } from "@util/vega-lite";

import {
  Colors,
  getAccentColor,
} from "../../feature/candlestick-chart/helpers";
import {
  indicatorAbsoluteChange,
  indicatorPercentageChange,
} from "./technical-indicators";

function constructMainLayerSpec(
  chartType: ChartType,
  colors: Colors,
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
        {
          encoding: {
            y: { field: "open", type: "quantitative" },
            y2: { field: "close", type: "quantitative" },
            fill: {
              condition: {
                test: { field: "volume", equal: 0 },
                value: colors.emphasis500,
              },
              value: "#00000000",
            },
            stroke: {
              condition: {
                test: { field: "volume", equal: 0 },
                value: colors.emphasis500,
              },
              value: "#00000000",
            },
            strokeWidth: {
              value: 4,
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
            fill: { value: colors.eldarRayBullPower },
          },
          mark: {
            type: "bar",
          },
        },
        {
          encoding: {
            y: { field: "bearPower", type: "quantitative" },
            fill: { value: colors.eldarRayBearPower },
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
            color: colors.forceIndex,
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
                value: colors.macdDivergenceBuy,
              },
              value: colors.macdDivergenceSell,
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
            color: colors.macdSignal,
          },
        },
        {
          encoding: {
            y: { field: "macd", type: "quantitative" },
          },
          mark: {
            type: "line",
            color: colors.macdMacd,
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
            color: colors.relativeStrengthIndex,
          },
        },
      ];
    case "volume":
      return [
        {
          encoding: {
            y: { field: "volume", type: "quantitative" },
            fill: {
              condition: {
                test: { field: "open", lt: "close" },
                value: colors.volumeBuy,
              },
              value: colors.volumeSell,
            },
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
  priceMonitoringBounds?: PriceMonitoringBounds[],
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
        if (!priceMonitoringBounds) {
          return [];
        }

        return priceMonitoringBounds.flatMap((_bounds, i) => [
          {
            encoding: {
              y: { field: `minValidPrice_${i + 1}`, type: "quantitative" },
            },
            mark: {
              type: "line",
              color: colors[getAccentColor(colorIndex++)],
            },
          },
          {
            encoding: {
              y: { field: `maxValidPrice_${i + 1}`, type: "quantitative" },
            },
            mark: {
              type: "line",
              color: colors[getAccentColor(colorIndex++)],
            },
          },
          {
            encoding: {
              y: { field: `referencePrice_${i + 1}`, type: "quantitative" },
            },
            mark: {
              type: "line",
              color: colors[getAccentColor(colorIndex++)],
            },
          },
        ]);
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
    data.map((d) => d.close),
  );

  const percentageChangeData24 = indicatorPercentageChange().period(25)(
    data.map((d) => d.close),
  );

  const absoluteChangeData = indicatorAbsoluteChange().period(2)(
    data.map((d) => d.close),
  );

  data = data.map((d, i) => ({
    ...d,
    percentageChange: percentageChangeData[i],
    percentageChangeData24: percentageChangeData24[i],
    absoluteChange: absoluteChangeData[i],
  }));

  if (priceMonitoringBounds) {
    for (let i = 0; i < priceMonitoringBounds.length; i++) {
      data = data.map((d) => ({
        ...d,
        [`maxValidPrice_${i + 1}`]: priceMonitoringBounds[i].maxValidPrice,
        [`minValidPrice_${i + 1}`]: priceMonitoringBounds[i].minValidPrice,
        [`referencePrice_${i + 1}`]: priceMonitoringBounds[i].referencePrice,
      }));
    }
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
