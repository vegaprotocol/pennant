import * as React from "react";

import { Annotation, AnnotationProps } from "./annotation";
import { Meta, Story } from "@storybook/react";

export default {
  title: "Components/Annotation",
  component: Annotation,
} as Meta;

const Template: Story<AnnotationProps> = (args) => (
  <div style={{ backgroundColor: "black", padding: "24px 24px" }}>
    <Annotation {...args} />
  </div>
);

export const Position = Template.bind({});
Position.args = {
  cells: [
    { label: "Position" },
    { label: "33,684.11" },
    { label: "+100", fill: true },
    { label: "PnL +12,943.01", stroke: true },
    { label: "Close", onClick: console.log },
  ],
  intent: "success",
};

export const Limit = Template.bind({});
Limit.args = {
  cells: [
    { label: "Limit GTC", stroke: true },
    { label: "33,300.00" },
    { label: "+100", stroke: true },
    { label: "Cancel", onClick: console.log },
  ],
  intent: "success",
};

export const LimitGt = Template.bind({});
LimitGt.args = {
  cells: [
    { label: "Limit GT16:00", stroke: true },
    { label: "41,100.00" },
    { label: "-50", stroke: true },
    { label: "Cancel", onClick: console.log },
  ],
  intent: "danger",
};
