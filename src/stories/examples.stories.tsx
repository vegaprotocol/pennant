import "./examples.stories.scss";

import { Meta, Story } from "@storybook/react/types-6-0";
import {
  PlotContainer,
  PlotContainerProps,
} from "../components/plot-container";

import { Colors } from "../helpers";
import { Interval } from "../api/vega-graphql";
import { extendCandle } from "../data/json-data-source";
import json from "../data/data.json";

export default {
  title: "Overview/Examples",
  component: PlotContainer,
} as Meta;

const Template: Story<PlotContainerProps> = (args) => {
  const data = json[args.interval].candles.map((candle) =>
    extendCandle(candle, args.decimalPlaces)
  );

  return (
    <div className="candlestick-chart-wrapper">
      <PlotContainer {...args} data={data} />
    </div>
  );
};

export const PriceMonitoringBounds = Template.bind({});
PriceMonitoringBounds.args = {
  interval: Interval.I5M,
  decimalPlaces: 5,
  view: [
    {
      name: "main",
      layer: [
        {
          encoding: {
            x: { field: "date", type: "temporal" },
            y: { type: "quantitative", scale: { zero: false } },
            color: {
              condition: { test: ["lt", "open", "close"], value: "#26ff8a" },
              value: "#ff2641",
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
                    test: ["lt", "open", "close"],
                    value: "#246340",
                  },
                  value: "#ff2641",
                },
                stroke: {
                  condition: {
                    test: ["lt", "open", "close"],
                    value: "#26ff8a",
                  },
                  value: "#ff2641",
                },
              },
            },
          ],
        },
        {
          data: {
            values: [{ max: 620.4, min: 552.45, ref: 586.46 }],
          },
          layer: [
            {
              encoding: {
                y: { field: "max" },
                color: { value: Colors.VEGA_GREEN },
              },
              mark: "rule",
            },
            {
              encoding: {
                y: { field: "min" },
                color: { value: Colors.VEGA_RED },
              },
              mark: "rule",
            },
            {
              encoding: {
                y: { field: "ref" },
                color: { value: Colors.VEGA_ORANGE },
              },
              mark: "rule",
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
        y: { field: "volume", type: "quantitative", scale: { zero: true } },
      },
    },
  ],
};
