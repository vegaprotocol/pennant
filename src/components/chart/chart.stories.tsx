import { Chart, ChartProps } from "./chart";
import { Meta, Story } from "@storybook/react/types-6-0";

import { EmptyDataSource } from "../../stories/data-source/empty-data-source";
import { Interval } from "../../stories/api/vega-graphql";
import { JsonDataSource } from "../../stories/data-source/json-data-source";

export default {
  title: "Components/Chart",
  component: Chart,
} as Meta;

const Template: Story<ChartProps> = (args) => (
  <div style={{ height: "400px" }}>
    <Chart {...args} />
  </div>
);

export const Simple = Template.bind({});
Simple.args = { dataSource: new JsonDataSource("", 5), interval: Interval.I5M };

export const Study = Template.bind({});
Study.args = {
  ...Simple.args,
  options: {
    chartType: "area",
    studies: ["macd"],
  },
};

export const Positions = Template.bind({});
Positions.args = {
  ...Simple.args,
  options: { ...Simple.args.options, chartType: "area" },
};

export const NoData = Template.bind({});
NoData.args = { dataSource: new EmptyDataSource(), interval: Interval.I5M };
