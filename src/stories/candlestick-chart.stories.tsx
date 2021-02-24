import "./candlestick-chart.stories.scss";

import {
  CandleStickChartProps,
  CandlestickChart,
} from "../components/candlestick-chart";
import { Meta, Story } from "@storybook/react/types-6-0";

import { Interval } from "../api/vega-graphql";
import React from "react";
import { extendCandle } from "../data/json-data-source";
import json from "../data/data.json";

export default {
  title: "Example/CandlestickChart",
  component: CandlestickChart,
} as Meta;

const Template: Story<CandleStickChartProps> = (args) => {
  const data = json[args.interval].candles.map((candle) =>
    extendCandle(candle, args.decimalPlaces)
  );

  return (
    <div className="candlestick-chart-wrapper">
      <CandlestickChart {...args} data={data} />
    </div>
  );
};

export const Simple = Template.bind({});
Simple.args = {
  interval: Interval.I5M,
  decimalPlaces: 5,
};
