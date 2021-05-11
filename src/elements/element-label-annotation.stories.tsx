import { Meta, Story } from "@storybook/react";
import { scaleLinear, scaleTime } from "d3-scale";

import React from "react";
import { Cell, LabelAnnotationElement } from ".";
import { Intent } from "../types";

export default {
  title: "Elements/LabelAnnotationElement",
} as Meta;

const Template: Story<{ cells: Cell[]; intent: Intent; y: number }> = (
  args
) => {
  const ref = React.useRef<HTMLCanvasElement>(null!);

  React.useEffect(() => {
    const ctx = ref.current.getContext("2d");

    if (ctx) {
      const element = new LabelAnnotationElement({
        ...args,
      });

      const xScale = scaleTime().range([0, 600]);
      const yScale = scaleLinear().domain([0, 150]).range([300, 0]);

      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, 600, 300);

      element.draw(ctx, xScale, yScale, window.devicePixelRatio);
    }
  }, [args]);

  return (
    <canvas
      ref={ref}
      width={600}
      height={300}
      style={{ width: "300px", height: "150px" }}
    />
  );
};

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
  y: 60,
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
  y: 60,
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
  y: 60,
};
