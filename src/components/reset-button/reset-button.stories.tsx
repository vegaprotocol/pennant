import * as React from "react";

import { Meta, Story } from "@storybook/react";
import { ResetButton, ResetButtonProps } from "./reset-button";

export default {
  title: "Components/ResetButton",
  component: ResetButton,
} as Meta;

const Template: Story<ResetButtonProps> = (args) => (
  <div
    style={{
      position: "relative",
      height: "400px",
      backgroundColor: "black",
      padding: "24px 24px",
    }}
  >
    <ResetButton {...args} />
  </div>
);

export const Primary = Template.bind({});
Primary.args = {};
