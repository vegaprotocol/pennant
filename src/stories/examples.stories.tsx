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

const Template: Story<PlotContainerProps> = ({ view, ...args }) => {
  const data = json[args.interval].candles.map((candle) =>
    extendCandle(candle, args.decimalPlaces)
  );

  view.push({
    name: "study",
    data: { values: data },
    encoding: {
      x: { field: "date", type: "temporal" },
    },
    layer: [
      {
        mark: "area",
        encoding: {
          y: { field: "macd", type: "quantitative" },
        },
      },
      {
        mark: "area",
        encoding: {
          y: { field: "signal", type: "quantitative" },
        },
      },
      {
        mark: "area",
        encoding: {
          y: {
            field: "divergence",
            type: "quantitative",
          },
        },
      },
    ],
  });

  return (
    <div className="candlestick-chart-wrapper">
      <PlotContainer {...args} view={view} data={data} />
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
            y: { type: "quantitative" },
            color: {
              condition: {
                test: { field: "open", lt: "close" },
                value: "#26ff8a",
              },
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
          data: {
            values: [{ max: 620.4, min: 552.45, ref: 586.46 }],
          },
          layer: [
            {
              encoding: {
                y: { field: "max" },
                color: { value: Colors.WHITE },
              },
              mark: "rule",
            },
            {
              encoding: {
                y: { field: "min" },
                color: { value: Colors.WHITE },
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
  ],
};
