import "./plot-container.stories.scss";

import { Meta, Story } from "@storybook/react/types-6-0";
import {
  PlotContainer,
  PlotContainerProps,
} from "../components/plot-container";

import { Interval } from "../api/vega-graphql";
import React from "react";
import { extendCandle } from "../data/json-data-source";
import json from "../data/data.json";

export default {
  title: "Components/PlotContainer",
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

export const Simple = Template.bind({});
Simple.args = {
  interval: Interval.I5M,
  decimalPlaces: 5,
};
