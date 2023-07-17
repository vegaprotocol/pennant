import { Meta, StoryFn } from "@storybook/react";
import { scaleLinear, scaleTime } from "d3-scale";
import { select } from "d3-selection";
import { useEffect, useRef } from "react";

import { LabelAnnotationHtmlElement } from "./element-label-annotation";

export default {
  title: "Elements/LabelAnnotationHtmlElement",
} as Meta;

export const Order: StoryFn = ({ labels }) => {
  const ref = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    const element = new LabelAnnotationHtmlElement({
      labels,
    });

    const xScale = scaleTime().range([0, 300]);
    const yScale = scaleLinear().domain([0, 150]).range([150, 0]);

    element.draw(select<Element, any>(ref.current), xScale, yScale);
  }, [labels]);

  return (
    <div
      ref={ref}
      style={{ position: "relative", height: "150px", width: "300px" }}
    />
  );
};

Order.args = {
  labels: [
    {
      type: "label",
      id: "1",
      cells: [
        {
          label: "Limit GTC",
          stroke: true,
        },
        {
          label: "1,852.00",
          numeric: true,
        },
        {
          label: "-0.001",
          numeric: true,
          stroke: true,
        },
      ],
      intent: "danger",
      y: 100,
    },
    {
      type: "label",
      id: "1",
      cells: [
        {
          label: "Limit GTC",
          stroke: true,
        },
        {
          label: "1,752.00",
          numeric: true,
        },
        {
          label: "+0.001",
          numeric: true,
          stroke: true,
        },
      ],
      intent: "success",
      y: 50,
    },
  ],
};
