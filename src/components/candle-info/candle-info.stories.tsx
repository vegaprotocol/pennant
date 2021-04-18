import { CandleInfo, CandleInfoProps } from "./candle-info";
import { Meta, Story } from "@storybook/react";

export default {
  title: "Components/CandleInfo",
  component: CandleInfo,
} as Meta;

const Template: Story<CandleInfoProps> = (args) => (
  <div style={{ backgroundColor: "black", padding: "24px 24px" }}>
    <CandleInfo {...args} />
  </div>
);

export const Primary = Template.bind({});
Primary.args = {
  candle: {
    date: new Date(2021, 2, 1),
    open: 100,
    close: 110,
    low: 90,
    high: 120,
    volume: 10000,
  },
};
