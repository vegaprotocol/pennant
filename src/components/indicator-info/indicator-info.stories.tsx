import { Meta, Story } from "@storybook/react";

import { IndicatorInfo, IndicatorInfoProps } from "./indicator-info";

export default {
  title: "Components/IndicatorInfo",
  component: IndicatorInfo,
} as Meta;

const Template: Story<IndicatorInfoProps> = (args) => (
  <div style={{ backgroundColor: "black", padding: "24px 24px" }}>
    <IndicatorInfo {...args} />
  </div>
);

export const MACD = Template.bind({});

MACD.args = {
  title: "MACD",
  info: [{ id: "signal", label: "", value: "0.34" }],
};

export const RelativeStrengthIndicator = Template.bind({});

RelativeStrengthIndicator.args = {
  title: "RSI",
  info: [{ id: "index", label: "", value: "100" }],
};
