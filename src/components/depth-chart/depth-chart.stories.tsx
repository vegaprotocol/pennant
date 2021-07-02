import { Meta, Story } from "@storybook/react";

import { DepthChart, DepthChartProps } from "./depth-chart";
import data from "./depth-chart.stories.json";

export default {
  title: "Components/DepthChart",
  DepthChart,
} as Meta;

const Template: Story<DepthChartProps> = (args) => {
  return <DepthChart {...args} />;
};

export const Default = Template.bind({});
Default.args = {
  buy: data.data.market.depth.buy.map((priceLevel) => ({
    price: Number(priceLevel.price),
    volume: Number(priceLevel.volume),
  })),
  sell: data.data.market.depth.sell.map((priceLevel) => ({
    price: Number(priceLevel.price),
    volume: Number(priceLevel.volume),
  })),
};
