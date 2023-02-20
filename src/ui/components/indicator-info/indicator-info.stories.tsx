import { Meta, Story } from "@storybook/react";

import { IndicatorInfo, IndicatorInfoProps } from "./indicator-info";

export default {
  title: "Components/IndicatorInfo",
  component: IndicatorInfo,
} as Meta;

const Template: Story<IndicatorInfoProps> = (args) => (
  <div
    style={{
      backgroundColor: "var(--pennant-background-surface-color)",
      color: "var(--pennant-font-color-base)",
      padding: "24px 24px",
    }}
  >
    <IndicatorInfo {...args} />
  </div>
);

export const CandleDetails = Template.bind({});

CandleDetails.args = {
  title: "",
  info: [
    { id: "date", label: "", value: "12:00 29 Jan 2021" },
    { id: "open", label: "O", value: "0.023" },
    { id: "high", label: "H", value: "0.023" },
    { id: "low", label: "L", value: "0.023" },
    { id: "close", label: "C", value: "0.023" },
    { id: "change", label: "Change", value: "+0.23%", intent: "success" },
  ],
};

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

export const Closable = Template.bind({});

Closable.args = {
  title: "RSI",
  info: [{ id: "index", label: "", value: "100" }],
  closeable: true,
};

export const Colors = Template.bind({});

Colors.args = {
  title: "RSI",
  info: [{ id: "index", label: "", value: "100", color: "#ffff00" }],
};
