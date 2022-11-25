import { Button, ButtonGroup } from "@blueprintjs/core";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import React, { useState } from "react";
import { useDarkMode } from "storybook-dark-mode";

import { PriceChart } from "./price-chart";
import series from "./price-chart.stories.json";

type Range = "1D" | "7D" | "1M" | "3M";

export default {
  title: "PriceChart",
  component: PriceChart,
} as ComponentMeta<typeof PriceChart>;

const Template: ComponentStory<typeof PriceChart> = (args) => {
  const theme = useDarkMode() ? "dark" : "light";
  const [range, setRange] = useState<Range>("1D");

  const data = series[range].map((d) => ({
    date: new Date(1000 * d.time),
    price: d.price,
  }));

  return (
    <div>
      <ButtonGroup style={{ minWidth: 200 }}>
        <Button
          text="1D"
          onClick={() => {
            setRange("1D");
          }}
        />
        <Button
          text="7D"
          onClick={() => {
            setRange("7D");
          }}
        />
        <Button
          text="1M"
          onClick={() => {
            setRange("1M");
          }}
        />
        <Button
          text="3M"
          onClick={() => {
            setRange("3M");
          }}
        />
      </ButtonGroup>
      <div
        style={{
          resize: "both",
          overflow: "scroll",
          width: "500px",
          height: "300px",
        }}
      >
        <PriceChart data={data} theme={theme} />
      </div>
    </div>
  );
};

export const Primary = Template.bind({});
