import { Meta, Story } from "@storybook/react";
import { scaleLinear, scaleTime } from "d3-scale";

import React from "react";
import { LabelAnnotationElement } from ".";

export default {
  title: "Elements/LabelAnnotationElement",
  argTypes: {
    y: {
      control: {
        type: "range",
        min: 0,
        max: 150,
        step: 10,
      },
    },
  },
} as Meta;

export const Position: Story = ({ y, ...rest }) => {
  const ref = React.useRef<HTMLCanvasElement>(null!);

  React.useEffect(() => {
    const ctx = ref.current.getContext("2d");

    if (ctx) {
      const element = new LabelAnnotationElement({
        y: y,
      });

      const xScale = scaleTime().range([0, 300]);
      const yScale = scaleLinear().domain([0, 150]).range([150, 0]);

      element.draw(ctx, xScale, yScale);
    }
  }, [y]);

  return <canvas ref={ref} />;
};
Position.args = {
  y: 100,
};
