import { Meta, Story } from "@storybook/react";
import { range } from "d3-array";
import { useRef } from "react";

import {
  CandlestickSplitView,
  CandlestickSplitViewHandle,
  CandlestickSplitViewProps,
} from "./candlestick-split-view";

export default {
  title: "Components/CandlestickSplitView",
  Component: CandlestickSplitView,
  argTypes: {
    numViews: {
      control: { type: "number", min: 1, max: 10, step: 1 },
    },
  },
} as Meta;

const Template: Story<
  Omit<CandlestickSplitViewProps, "views"> & { numViews: number }
> = ({ numViews, ...args }) => {
  const ref = useRef<CandlestickSplitViewHandle>(null!);

  const views = range(0, numViews).map((n) => ({ id: String(n) }));

  return (
    <div
      style={{
        width: "80vw",
        height: "80vh",
      }}
    >
      <CandlestickSplitView ref={ref} views={views} {...args} />
    </div>
  );
};

export const Basic = Template.bind({});
Basic.args = {
  numViews: 2,
};
