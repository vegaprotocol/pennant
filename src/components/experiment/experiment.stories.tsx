import { Experiment, ExperimentProps } from "./experiment";
import { Meta, Story } from "@storybook/react";

export default {
  title: "Experiment",
  component: Experiment,
} as Meta;

export const Simple: Story<ExperimentProps> = (args) => {
  return <Experiment {...args} />;
};

Simple.args = {};
