import { Candle, ChartType, Overlay, Study } from "../types";
import { BaseSpec, TopLevelSpec } from "../vega-lite/spec";
import { Transform } from "../vega-lite/transform";
import { Colors } from "./helpers-color";

function constructMainLayerSpec(chartType: ChartType): BaseSpec[] {
  switch (chartType) {
    case "area":
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
                  color: "#000000",
                },
              ],
            },
          },
        },
      ];
    case "line":
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
    case "ohlc":
      return [
        {
          encoding: {
            y: { field: "low", type: "quantitative" },
            y2: { field: "high", type: "quantitative" },
            color: {
              condition: {
                test: { field: "open", lt: "close" },
                value: Colors.GREEN,
              },
              value: Colors.RED,
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
                value: Colors.GREEN,
              },
              value: Colors.RED,
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
                value: Colors.GREEN,
              },
              value: Colors.RED,
            },
          },
          mark: {
            type: "tick",
            orient: "right",
          },
        },
      ];
    case "candle":
    default:
      return [
        {
          encoding: {
            y: { field: "low", type: "quantitative" },
            y2: { field: "high", type: "quantitative" },
            color: {
              condition: {
                test: { field: "open", lt: "close" },
                value: Colors.GREEN,
              },
              value: Colors.RED,
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
                value: Colors.GREEN_DARK,
              },
              value: Colors.RED,
            },
            stroke: {
              condition: {
                test: { field: "open", lt: "close" },
                value: Colors.GREEN,
              },
              value: Colors.RED,
            },
          },
          mark: {
            type: "bar",
          },
        },
      ];
  }
}

function constructStudyLayerSpec(study: Study): BaseSpec[] {
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
    case "macd":
      return [
        {
          encoding: {
            y: { field: "divergence", type: "quantitative" },
            fill: {
              condition: {
                test: { field: "divergence", gt: 0 },
                value: Colors.GREEN_DARK,
              },
              value: Colors.RED,
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
            color: Colors.VEGA_ORANGE,
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
            y: { field: "index", type: "quantitative" },
          },
          mark: {
            type: "line",
            color: Colors.VEGA_YELLOW,
          },
        },
      ];
    case "volume":
      return [
        {
          encoding: {
            y: { field: "volume", type: "quantitative" },
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

function constructOverlayLayerSpec(overlay: Overlay): BaseSpec[] {
  switch (overlay) {
    case "bollinger":
      return [
        {
          encoding: {
            y: { field: "lower", type: "quantitative" },
          },
          mark: {
            type: "line",
            color: Colors.VEGA_ORANGE,
          },
        },
        {
          encoding: {
            y: { field: "upper", type: "quantitative" },
          },
          mark: {
            type: "line",
            color: Colors.VEGA_YELLOW,
          },
        },
      ];
    case "envelope":
      return [
        {
          encoding: {
            y: { field: "lower", type: "quantitative" },
          },
          mark: {
            type: "line",
            color: Colors.VEGA_ORANGE,
          },
        },
        {
          encoding: {
            y: { field: "upper", type: "quantitative" },
          },
          mark: {
            type: "line",
            color: Colors.VEGA_YELLOW,
          },
        },
      ];
    case "exponentialMovingAverage":
      return [
        {
          encoding: {
            y: { field: "movingAverage", type: "quantitative" },
          },
          mark: {
            type: "line",
            color: Colors.VEGA_YELLOW,
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
            color: Colors.VEGA_YELLOW,
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
            color: Colors.VEGA_ORANGE,
          },
        },
        {
          encoding: {
            y: { field: "maxValidPrice", type: "quantitative" },
          },
          mark: {
            type: "line",
            color: Colors.VEGA_GREEN,
          },
        },
        {
          encoding: {
            y: { field: "referencePrice", type: "quantitative" },
          },
          mark: {
            type: "line",
            color: Colors.VEGA_YELLOW,
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
      return [{ indicator: "bollinger", on: "close" }];
    case "envelope":
      return [{ indicator: "envelope", on: "close" }];
    case "exponentialMovingAverage":
      return [{ indicator: "exponentialMovingAverage", on: "close" }];
    case "movingAverage":
      return [{ indicator: "movingAverage", on: "close" }];
    default:
      return [];
  }
}

function constructStudyTransform(study: Study): Transform[] {
  switch (study) {
    case "eldarRay":
      return [{ indicator: "eldarRay", on: "close" }];
    case "macd":
      return [{ indicator: "macd", on: "close" }];
    case "relativeStrengthIndex":
      return [{ indicator: "relativeStrengthIndex", on: "close" }];
    default:
      return [];
  }
}

export function constructTopLevelSpec(
  data: Candle[],
  chartType: ChartType,
  overlay?: Overlay,
  study?: Study,
  priceMonitoringBounds?: any
) {
  const vconcat: BaseSpec[] = [];
  const transform: Transform[] = [];

  const mainSpecification: BaseSpec = {
    name: "main",
    layer: constructMainLayerSpec(chartType),
  };

  if (overlay) {
    transform.push(...constructOverlayTransform(overlay));
    mainSpecification.layer?.push(...constructOverlayLayerSpec(overlay));
  }

  vconcat.push(mainSpecification);

  if (study) {
    transform.push(...constructStudyTransform(study));

    const studySpecification: BaseSpec = {
      name: study,
      layer: constructStudyLayerSpec(study),
    };

    vconcat.push(studySpecification);
  }

  // Calculate change
  data = data.map((d, i) => ({
    ...d,
    percentageChange:
      i > 0 ? (d.close - data[i - 1].close) / data[i - 1].close : NaN,
    absoluteChange: i > 0 ? d.close - data[i - 1].close : NaN,
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
