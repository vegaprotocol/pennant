import { Meta, Story } from "@storybook/react";
import { useRef } from "react";

import { Pane, PaneProps } from "./pane";

export default {
  title: "Components/Pane",
  Component: Pane,
} as Meta;

const Template: Story<PaneProps> = (args) => {
  return (
    <div
      style={{
        width: "80vw",
        height: "80vh",
        resize: "both",
        overflow: "scroll",
      }}
    >
      <Pane {...args}>
        <div>Overlay</div>
      </Pane>
    </div>
  );
};

export const Basic = Template.bind({});
Basic.args = {};
