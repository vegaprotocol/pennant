import { Meta, Story } from "@storybook/react";

import { NonIdealState, NonIdealStateProps } from "./non-ideal-state";

export default {
  title: "Components/NonIdealState",
  component: NonIdealState,
} as Meta;

const Template: Story<NonIdealStateProps> = (args) => (
  <div style={{ padding: "24px 24px" }}>
    <NonIdealState {...args} />
  </div>
);

export const Primary = Template.bind({});
Primary.args = {
  title: "No data found",
  description: "Try a different market",
};
