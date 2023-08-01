import { getColors } from "../../feature/candlestick-chart/helpers";
import { constructTopLevelSpec } from "./specification";

const colors = getColors(null);

const data: any[] = [{ open: 100, close: 100 }];

const outputData: any[] = [
  {
    open: 100,
    close: 100,
    absoluteChange: NaN,
    percentageChange: NaN,
    percentageChangeData24: NaN,
  },
];

describe("constructTopLevelSpec", () => {
  test("Basic candle chart spec", () => {
    expect(constructTopLevelSpec(data, "candle", colors)).toEqual({
      data: { values: outputData },
      encoding: { x: { field: "date", type: "temporal" } },
      transform: [],
      vconcat: [
        {
          name: "main",
          layer: [
            {
              encoding: {
                color: {
                  condition: {
                    test: { field: "open", lt: "close" },
                    value: "#26ff8a",
                  },
                  value: "#ff261a",
                },
                y: { field: "low", type: "quantitative" },
                y2: { field: "high", type: "quantitative" },
              },
              mark: { type: "rule" },
            },
            {
              encoding: {
                fill: {
                  condition: {
                    test: { field: "open", lt: "close" },
                    value: "#16452d",
                  },
                  value: "#ff261a",
                },
                stroke: {
                  condition: {
                    test: { field: "open", lt: "close" },
                    value: "#26ff8a",
                  },
                  value: "#ff261a",
                },
                y: { field: "open", type: "quantitative" },
                y2: { field: "close", type: "quantitative" },
              },
              mark: { type: "bar" },
            },
            {
              encoding: {
                fill: {
                  condition: {
                    test: {
                      equal: 0,
                      field: "volume",
                    },
                    value: "#494949",
                  },
                  value: "#00000000",
                },
                stroke: {
                  condition: {
                    test: {
                      equal: 0,
                      field: "volume",
                    },
                    value: "#494949",
                  },
                  value: "#00000000",
                },
                strokeWidth: {
                  value: 4,
                },
                y: {
                  field: "open",
                  type: "quantitative",
                },
                y2: {
                  field: "close",
                  type: "quantitative",
                },
              },
              mark: {
                type: "bar",
              },
            },
          ],
        },
      ],
    });
  });

  test("Basic area chart spec", () => {
    expect(constructTopLevelSpec(data, "area", colors)).toEqual({
      data: { values: outputData },
      encoding: { x: { field: "date", type: "temporal" } },
      transform: [],
      vconcat: [
        {
          name: "main",
          layer: [
            {
              encoding: { y: { field: "close", type: "quantitative" } },
              mark: {
                color: {
                  gradient: "linear",
                  stops: [
                    { color: "#044e80", offset: 0 },
                    { color: "#d9822b", offset: 1 },
                  ],
                },
                line: { color: "#009cff" },
                type: "area",
              },
            },
          ],
        },
      ],
    });
  });

  test("Basic line chart spec", () => {
    expect(constructTopLevelSpec(data, "line", colors)).toEqual({
      data: { values: outputData },
      encoding: { x: { field: "date", type: "temporal" } },
      transform: [],
      vconcat: [
        {
          name: "main",
          layer: [
            {
              encoding: { y: { field: "close", type: "quantitative" } },
              mark: {
                color: "#009cff",
                type: "line",
              },
            },
          ],
        },
      ],
    });
  });

  test("Basic area chart spec with overlay", () => {
    expect(constructTopLevelSpec(data, "area", colors, ["bollinger"])).toEqual({
      data: { values: outputData },
      encoding: { x: { field: "date", type: "temporal" } },
      transform: [
        {
          indicator: "bollinger",
          on: ["close"],
          as: ["bollingerUpper", "bollingerAverage", "bollingerLower"],
        },
      ],
      vconcat: [
        {
          name: "main",
          layer: [
            {
              encoding: { y: { field: "close", type: "quantitative" } },
              mark: {
                color: {
                  gradient: "linear",
                  stops: [
                    { color: "#044e80", offset: 0 },
                    { color: "#d9822b", offset: 1 },
                  ],
                },
                line: { color: "#009cff" },
                type: "area",
              },
            },
            {
              encoding: {
                y: { field: "bollingerLower", type: "quantitative" },
              },
              mark: { color: "#d9822b", type: "line" },
            },
            {
              encoding: {
                y: { field: "bollingerUpper", type: "quantitative" },
              },
              mark: { color: "#daff0d", type: "line" },
            },
          ],
        },
      ],
    });
  });

  test("Basic area chart spec with study", () => {
    expect(
      constructTopLevelSpec(data, "area", colors, undefined, ["volume"]),
    ).toEqual({
      data: { values: outputData },
      encoding: { x: { field: "date", type: "temporal" } },
      transform: [],
      vconcat: [
        {
          name: "main",
          layer: [
            {
              encoding: { y: { field: "close", type: "quantitative" } },
              mark: {
                color: {
                  gradient: "linear",
                  stops: [
                    { color: "#044e80", offset: 0 },
                    { color: "#d9822b", offset: 1 },
                  ],
                },
                line: { color: "#009cff" },
                type: "area",
              },
            },
          ],
        },
        {
          name: "volume",
          layer: [
            {
              encoding: {
                fill: {
                  condition: {
                    test: {
                      field: "open",
                      lt: "close",
                    },
                    value: "#26ff8a",
                  },
                  value: "#ff261a",
                },
                y: { field: "volume", type: "quantitative" },
              },
              mark: { type: "bar" },
            },
          ],
        },
      ],
    });
  });
});
