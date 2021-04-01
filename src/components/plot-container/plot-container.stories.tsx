import "./plot-container.stories.scss";

import { Meta, Story } from "@storybook/react/types-6-0";
import { PlotContainer, PlotContainerProps } from "./plot-container";

import { Interval } from "../../api/vega-graphql";
import { extendCandle } from "../../data/json-data-source";
import json from "../../data/data.json";

export default {
  title: "Components/PlotContainer",
  component: PlotContainer,
} as Meta;

const Template: Story<PlotContainerProps> = (args) => {
  return (
    <div className="candlestick-chart-wrapper">
      <PlotContainer {...args} />
    </div>
  );
};

export const Simple = Template.bind({});
Simple.args = {
  interval: Interval.I5M,
  decimalPlaces: 5,
  specification: {
    name: "main",
    data: {
      values: json[Interval.I5M].candles.map((candle) =>
        extendCandle(candle, 5)
      ),
    },
    encoding: {
      x: { field: "date", type: "temporal" },
      y: { type: "quantitative" },
      color: {
        condition: { test: { field: "open", lt: "close" }, value: "#26ff8a" },
        value: "#ff2641",
      },
    },
    vconcat: [
      {
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
            },
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
  },
};
