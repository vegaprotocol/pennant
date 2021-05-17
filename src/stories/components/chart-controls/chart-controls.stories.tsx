import "./chart-controls.stories.scss";

import { ChartControls, ChartControlsProps } from "./chart-controls";
import { ChartType, Overlay, Study } from "../../../types";
import { Meta, Story } from "@storybook/react";

import { FocusStyleManager } from "@blueprintjs/core";
import { Interval } from "../../api/vega-graphql";
import { useState } from "react";

export default {
  title: "Example components/ChartControls",
  component: ChartControls,
} as Meta;

FocusStyleManager.onlyShowFocusOnTabs();

const Template: Story<ChartControlsProps> = (args) => {
  const [interval, setInterval] = useState<Interval>(Interval.I5M);
  const [chartType, setChartType] = useState<ChartType>("candle");
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [study, setStudy] = useState<Study | null>(null);

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

export const Basic = Template.bind({});
Basic.args = {};
