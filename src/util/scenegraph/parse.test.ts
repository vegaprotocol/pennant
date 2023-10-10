import { TopLevelSpec } from "@util/vega-lite";

import { getColors } from "../../feature/candlestick-chart/helpers";
import { parse, parseLayer } from "./parse";

const colors = getColors(null);

test("simple case", () => {
  const input: TopLevelSpec = {
    data: { values: [{ date: new Date(2021, 3, 15), price: 100 }] },
    vconcat: [
      {
        mark: "bar",
        encoding: {
          x: { field: "date", type: "temporal" },
          y: { field: "price", type: "quantitative" },
        },
      },
    ],
  };

  const scenegraph = parse(
    input,
    10,
    { strokeWidth: 1, innerPadding: 0.4, maxPaddingInPixels: 2 },
    100,
    0,
    [],
  );

  expect(scenegraph).toHaveProperty("panes");
  expect(scenegraph?.panes).toHaveLength(1);
});

test("candlestick chart with study", () => {
  const input: TopLevelSpec = {
    data: {
      values: [
        {
          date: new Date(2021, 3, 15),
          low: 100,
          high: 100,
          open: 100,
          close: 100,
        },
      ],
    },
    vconcat: [
      {
        encoding: {
          x: {
            field: "date",
            type: "temporal",
          },
          y: {
            type: "quantitative",
          },
          color: {
            condition: {
              test: { field: "open", lt: "close" },
              value: colors.buyStroke,
            },
            value: colors.sellStroke,
          },
        },
        layer: [
          {
            name: "wick",
            mark: "rule",
            encoding: { y: { field: "low" }, y2: { field: "high" } },
          },
          {
            name: "candle",
            mark: "bar",
            encoding: {
              y: { field: "open" },
              y2: { field: "close" },
              fill: {
                condition: {
                  test: { field: "open", lt: "close" },
                  value: colors.buyFill,
                },
                value: colors.sellFill,
              },
              stroke: {
                condition: {
                  test: { field: "open", lt: "close" },
                  value: colors.buyStroke,
                },
                value: colors.sellStroke,
              },
            },
          },
          {
            data: {
              values: [{ max: 3100, min: 3000 }],
            },
            layer: [
              {
                mark: "rule",
                encoding: { y: { field: "max" }, color: { value: "green" } },
              },
              {
                mark: "rule",
                encoding: { y: { field: "min" }, color: { value: "red" } },
              },
            ],
          },
        ],
      },
      {
        name: "study",
        mark: "bar",
        encoding: {
          x: { field: "date", type: "temporal" },
          y: { field: "volume", type: "quantitative" },
        },
      },
    ],
  };

  const scenegraph = parse(
    input,
    10,
    { strokeWidth: 1, innerPadding: 0.4, maxPaddingInPixels: 2 },
    100,
    0,
    [],
  );

  expect(scenegraph).toHaveProperty("panes");
  expect(scenegraph?.panes).toHaveLength(2);
  expect(scenegraph?.panes[0].renderableElements).toHaveLength(4);
});

test("recursively parse a layer", () => {
  const input: TopLevelSpec = {
    layer: [
      {
        data: {
          values: [
            {
              date: new Date(2020, 2, 15),
              low: 90,
              open: 100,
              close: 110,
              high: 120,
            },
          ],
        },
        encoding: {
          x: {
            field: "date",
            type: "temporal",
          },
          y: {
            type: "quantitative",
          },
          color: {
            condition: {
              test: { field: "open", lt: "close" },
              value: colors.buyFill,
            },
            value: colors.sellFill,
          },
        },
        layer: [
          {
            name: "wick",
            mark: "rule",
            encoding: { y: { field: "low" }, y2: { field: "high" } },
          },
          {
            name: "candle",
            mark: "bar",
            encoding: {
              y: { field: "open" },
              y2: { field: "close" },
              fill: {
                condition: {
                  test: { field: "open", lt: "close" },
                  value: colors.buyStroke,
                },
                value: colors.sellStroke,
              },
              stroke: {
                condition: {
                  test: { field: "open", lt: "close" },
                  value: colors.buyFill,
                },
                value: colors.sellFill,
              },
            },
          },
        ],
      },
      {
        data: {
          values: [{ max: 3100, min: 3000 }],
        },
        layer: [
          {
            mark: "rule",
            encoding: { y: { field: "max" }, color: { value: "green" } },
          },
          {
            mark: "rule",
            encoding: { y: { field: "min" }, color: { value: "red" } },
          },
        ],
      },
    ],
  };

  const layer = parseLayer(
    input,
    { values: [] },
    {},
    10,
    { strokeWidth: 1, innerPadding: 0.4, maxPaddingInPixels: 2 },
    100,
  );

  expect(layer).toHaveLength(4);
});
