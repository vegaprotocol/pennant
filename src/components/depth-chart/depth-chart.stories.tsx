import { Meta, Story } from "@storybook/react";
import { orderBy } from "lodash";

import { DepthChart, DepthChartProps } from "./depth-chart";
import data from "./depth-chart.stories.json";

export default {
  title: "Components/DepthChart",
  DepthChart,
} as Meta;

const vegaData = {
  asks: data.vega.data.market.depth.sell.map((priceLevel) => ({
    price: Number(priceLevel.price),
    volume: Number(priceLevel.volume),
  })),
  bids: data.vega.data.market.depth.buy.map((priceLevel) => ({
    price: Number(priceLevel.price),
    volume: Number(priceLevel.volume),
  })),
};

const binanceData = {
  asks: orderBy(
    data.binance.asks.map((ask) => ({ price: +ask[0], volume: +ask[1] })),
    ["price"]
  ),
  bids: orderBy(
    data.binance.bids.map((bid) => ({ price: +bid[0], volume: +bid[1] })),
    ["price"],
    ["desc"]
  ),
};

const Template: Story<DepthChartProps> = (args) => {
  return <DepthChart {...args} />;
};

export const Vega = Template.bind({});
Vega.args = {
  buy: vegaData.asks,
  sell: vegaData.bids,
};

export const Binance = Template.bind({});
Binance.args = {
  buy: binanceData.bids,
  sell: binanceData.asks,
};
