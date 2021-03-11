import { Chart, ChartProps } from "./chart";
import { Meta, Story } from "@storybook/react/types-6-0";

import { Interval } from "../api/vega-graphql";
import { JsonDataSource } from "../data/json-data-source";

export default {
  title: "Components/Chart",
  component: Chart,
} as Meta;

const Template: Story<ChartProps> = (args) => (
  <div style={{ height: "800px" }}>
    <Chart {...args} />
  </div>
);

export const Simple = Template.bind({});
Simple.args = { dataSource: new JsonDataSource("", 5), interval: Interval.I5M };
