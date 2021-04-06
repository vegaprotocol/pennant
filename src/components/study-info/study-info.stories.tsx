import { Meta, Story } from "@storybook/react";
import { StudyInfo, StudyInfoProps } from "./study-info";

export default {
  title: "Components/StudyInfo",
  component: StudyInfo,
} as Meta;

const Template: Story<StudyInfoProps> = (args) => (
  <div style={{ backgroundColor: "black", padding: "24px 24px" }}>
    <StudyInfo {...args} />
  </div>
);

export const Primary = Template.bind({});
Primary.args = {
  title: "MACD",
  info: [{ id: "signal", label: "S", value: "0.34" }],
};
