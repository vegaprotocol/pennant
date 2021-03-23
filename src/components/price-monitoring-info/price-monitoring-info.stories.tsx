import { Meta, Story } from "@storybook/react";
import {
  PriceMonitoringInfo,
  PriceMonitoringInfoProps,
} from "./price-monitoring-info";

export default {
  title: "Components/PriceMonitoringInfo",
  component: PriceMonitoringInfo,
} as Meta;

const Template: Story<PriceMonitoringInfoProps> = (args) => (
  <div style={{ backgroundColor: "black", padding: "24px 24px" }}>
    <PriceMonitoringInfo {...args} />
  </div>
);

export const Primary = Template.bind({});
Primary.args = {
  priceMonitoringBounds: {
    minValidPrice: 39799.22127,
    maxValidPrice: 55639.26542,
    referencePrice: 55639.26542,
  },
  decimalPlaces: 5,
};
