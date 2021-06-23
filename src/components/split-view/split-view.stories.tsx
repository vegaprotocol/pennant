import { Meta, Story } from "@storybook/react";

import { SplitView, SplitViewProps } from "./split-view";

export default {
  title: "Components/SplitView",
  component: SplitView,
} as Meta;

const Template: Story<SplitViewProps> = (args) => {
  return (
    <div style={{ border: "1px solid grey", height: "100%" }}>
      <SplitView {...args} />
    </div>
  );
};

export const Basic = Template.bind({});
Basic.args = {
  main: <div style={{ backgroundColor: "rgb(6,6,6)", height: "100%" }} />,
  study: (
    <div
      style={{
        backgroundColor: "rgb(6,6,6)",
        borderTop: "1px solid rgba(128,128,128,0.35)",
        height: "100%",
      }}
    />
  ),
  showStudy: true,
  initialProportion: 2 / 3,
};

export const NoStudy = Template.bind({});
NoStudy.args = {
  main: <div style={{ backgroundColor: "rgb(6,6,6)", height: "100%" }} />,
  study: null,
  showStudy: false,
};
