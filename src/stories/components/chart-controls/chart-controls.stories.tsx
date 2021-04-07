import "./chart-controls.stories.scss";

import * as React from "react";

import { ChartControls, ChartControlsProps } from "./chart-controls";
import { ChartType, Overlay, Study } from "../../../components/chart";
import { Meta, Story } from "@storybook/react";

import { FocusStyleManager } from "@blueprintjs/core";
import { Interval } from "../../api/vega-graphql";

export default {
  title: "Example components/ChartControls",
  component: ChartControls,
} as Meta;

FocusStyleManager.onlyShowFocusOnTabs();

const Template: Story<ChartControlsProps> = (args) => {
  const [interval, setInterval] = React.useState<Interval>(Interval.I5M);
  const [chartType, setChartType] = React.useState<ChartType>("area");
  const [overlay, setOverlay] = React.useState<Overlay | null>(null);
  const [study, setStudy] = React.useState<Study | null>(null);

  return (
    <div className="bp3-dark docs-example">
      <ChartControls
      {...args}
        interval={interval}
        chartType={chartType}
        overlay={overlay}
        study={study}
        onSetInterval={setInterval}
        onSetChartType={setChartType}
        onSetOverlay={setOverlay}
        onSetStudy={setStudy}
      />
    </div>
  );
};

export const Primary = Template.bind({});
Primary.args = {};
