import { Meta, Story } from "@storybook/react";
import { useRef, useState } from "react";

import { Study } from "../../types";
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
  initialOptions: {
    studies: [
      { id: "4", study: Study.MACD },
      { id: "1", study: Study.MACD },
      { id: "2", study: Study.ELDAR_RAY },
      { id: "3", study: Study.FORCE_INDEX },
    ],
  },
};
