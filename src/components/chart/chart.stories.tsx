import { Meta, Story } from "@storybook/react/types-6-0";
import { useDarkMode } from "storybook-dark-mode";

import { Interval } from "../../stories/api/vega-graphql";
import { EmptyDataSource } from "../../stories/data-source/empty-data-source";
import { JsonDataSource } from "../../stories/data-source/json-data-source";
import { Chart, ChartProps } from "./chart";

export default {
  title: "Components/Chart",
  component: Chart,
} as Meta;

const Template: Story<ChartProps> = (args) => {
  const theme = useDarkMode() ? "dark" : "light";

  return (
    <div style={{ height: "400px" }}>
      <Chart {...args} theme={theme} />
    </div>
  );
};

export const Default = Template.bind({});
Default.args = {
  dataSource: new JsonDataSource("", 5),
  interval: Interval.I5M,
};

export const Study = Template.bind({});
Study.args = {
  ...Default.args,
  options: {
    chartType: "area",
    studies: ["macd"],
  },
};

export const Overlays = Template.bind({});
Overlays.args = {
  ...Default.args,
  options: {
    chartType: "candle",
    overlays: ["exponentialMovingAverage", "movingAverage"],
  },
};

export const Positions = Template.bind({});
Positions.args = {
  ...Default.args,
  options: { chartType: "area" },
};

export const NoData = Template.bind({});
NoData.args = { dataSource: new EmptyDataSource(), interval: Interval.I5M };

export const SimpleMode = Template.bind({});
SimpleMode.args = {
  ...Default.args,
  options: { studies: ["volume"], simple: true },
};

export const NoChange = Template.bind({});
NoChange.args = {
  dataSource: new JsonDataSource("", 5, "no-change-data.json", false),
  interval: Interval.I1D,
};
