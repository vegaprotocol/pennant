import { Meta, Story } from "@storybook/react";
import { useRef, useState } from "react";

import { JsonDataSource } from "../../stories/data-source/json-data-source";
import { Interval, Study } from "../../types";
import {
  CandlestickChart,
  CandlestickChartHandle,
  CandlestickChartProps,
  Options,
} from "./candlestick-chart";

export default {
  title: "Components/CandlestickChart",
  Component: CandlestickChart,
} as Meta;

const Template: Story<CandlestickChartProps & { initialOptions: Options }> = ({
  initialOptions,
  ...args
}) => {
  const ref = useRef<CandlestickChartHandle>(null!);

  const [options, setOptions] = useState(initialOptions);

  return (
    <div
      style={{
        width: "80vw",
        height: "80vh",
        resize: "both",
        overflow: "scroll",
      }}
    >
      <CandlestickChart
        ref={ref}
        options={options}
        onOptionsChanged={setOptions}
        {...args}
      />
    </div>
  );
};

export const Basic = Template.bind({});
Basic.args = {
  dataSource: new JsonDataSource("", 5),
  interval: Interval.I5M,
  initialOptions: {
    studies: [Study.MACD, Study.MACD, Study.ELDAR_RAY, Study.FORCE_INDEX],
  },
};

export const Simple = Template.bind({});
Simple.args = {
  dataSource: new JsonDataSource("", 5),
  interval: Interval.I5M,
  initialOptions: {
    simple: true,
    studies: [Study.MACD],
  },
};
