import "./chart-controls.stories.scss";

import { FocusStyleManager } from "@blueprintjs/core";
import { Meta, Story } from "@storybook/react";
import { useState } from "react";

import { ChartType, Interval, Overlay, Study } from "../../../types";
import { ChartControls, ChartControlsProps } from "./chart-controls";

export default {
  title: "Example components/ChartControls",
  component: ChartControls,
} as Meta;

FocusStyleManager.onlyShowFocusOnTabs();

const Template: Story<ChartControlsProps> = (args) => {
  const [interval, setInterval] = useState<Interval>(Interval.I5M);
  const [chartType, setChartType] = useState<ChartType>(ChartType.CANDLE);
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [studies, setStudies] = useState<Study[]>([]);

  return (
    <div className="bp3-dark docs-example">
      <ChartControls
        {...args}
        interval={interval}
        chartType={chartType}
        overlays={overlays}
        studies={studies}
        onSetInterval={setInterval}
        onSetChartType={setChartType}
        onSetOverlays={setOverlays}
        onSetStudies={setStudies}
      />
    </div>
  );
};

export const Basic = Template.bind({});
Basic.args = {};
