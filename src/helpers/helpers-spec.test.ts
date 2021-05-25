import { constructTopLevelSpec } from ".";

const data: any[] = [{ open: 100, close: 100 }];

const outputData: any[] = [
  { open: 100, close: 100, absoluteChange: NaN, percentageChange: NaN },
];

describe("constructTopLevelSpec", () => {
  test("Basic candle chart spec", () => {
    expect(constructTopLevelSpec(data, "candle")).toEqual({
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
                  value: "#ff2641",
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
                    value: "#246340",
                  },
                  value: "#ff2641",
                },
                stroke: {
                  condition: {
                    test: { field: "open", lt: "close" },
                    value: "#26ff8a",
                  },
                  value: "#ff2641",
                },
                y: { field: "open", type: "quantitative" },
                y2: { field: "close", type: "quantitative" },
              },
              mark: { type: "bar" },
            },
          ],
        },
      ],
    });
  });

  test("Basic area chart spec", () => {
    expect(constructTopLevelSpec(data, "area")).toEqual({
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
                    { color: "#000000", offset: 1 },
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
    expect(constructTopLevelSpec(data, "line")).toEqual({
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
    expect(constructTopLevelSpec(data, "area", "bollinger")).toEqual({
      data: { values: outputData },
      encoding: { x: { field: "date", type: "temporal" } },
      transform: [{ indicator: "bollinger", on: "close" }],
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
                    { color: "#000000", offset: 1 },
                  ],
                },
                line: { color: "#009cff" },
                type: "area",
              },
            },
            {
              encoding: { y: { field: "lower", type: "quantitative" } },
              mark: { color: "#d9822b", type: "line" },
            },
            {
              encoding: { y: { field: "upper", type: "quantitative" } },
              mark: { color: "#daff0d", type: "line" },
            },
          ],
        },
      ],
    });
  });

  test("Basic area chart spec with study", () => {
    expect(constructTopLevelSpec(data, "area", undefined, "volume")).toEqual({
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
                    { color: "#000000", offset: 1 },
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
              encoding: { y: { field: "volume", type: "quantitative" } },
              mark: { type: "bar" },
            },
          ],
        },
      ],
    });
  });
});
