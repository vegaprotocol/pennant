import "./plot-container.stories.scss";

import { Meta, Story } from "@storybook/react/types-6-0";

import { parse } from "../../scenegraph/parse";
import { Interval } from "../../stories/api/vega-graphql";
import json from "../../stories/data-source/data.json";
import { extendCandle } from "../../stories/data-source/json-data-source";
import { Scenegraph } from "../../types";
import { TopLevelSpec } from "../../vega-lite/spec";
import { PlotContainer, PlotContainerProps } from "./plot-container";

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

const specification: TopLevelSpec = {
  name: "main",
  data: {
    values: json[Interval.I5M].candles.map((candle) => extendCandle(candle, 5)),
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
};

export const Simple = Template.bind({});
Simple.args = {
  interval: Interval.I5M,
  scenegraph: parse(specification, 100, 0, []) as Scenegraph,
};
