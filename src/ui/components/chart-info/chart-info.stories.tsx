import { Meta, Story } from "@storybook/react";

import { ChartInfo, ChartInfoProps } from "./chart-info";

export default {
  title: "Components/ChartInfo",
  component: ChartInfo,
} as Meta;

const Template: Story<ChartInfoProps> = (args) => (
  <div style={{ backgroundColor: "black", padding: "24px 24px" }}>
    <ChartInfo {...args} />
  </div>
);

export const Primary = Template.bind({});
Primary.args = {
  bounds: [new Date(2021, 2, 1), new Date(2021, 2, 2)],
};
