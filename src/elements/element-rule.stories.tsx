import { Meta, Story } from "@storybook/react";
import { scaleLinear, scaleTime } from "d3-scale";
import { useEffect, useRef } from "react";

import { RuleElement } from ".";

export default {
  title: "Elements/RuleElement",
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

export const RuleMark: Story = ({ y, ...rest }) => {
  const ref = useRef<HTMLCanvasElement>(null!);

  useEffect(() => {
    const ctx = ref.current.getContext("2d");

    if (ctx) {
      const element = new RuleElement({
        x: null,
        x2: null,
        y: y,
        y2: null,
        color: "red",
      });

      const xScale = scaleTime().range([0, 300]);
      const yScale = scaleLinear().domain([0, 150]).range([150, 0]);

      element.draw(ctx, xScale, yScale);
    }
  }, [y]);

  return <canvas ref={ref} />;
};
RuleMark.args = {
  y: 100,
};
