import { Button, ButtonGroup } from "@blueprintjs/core";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import React, { useState } from "react";
import { useDarkMode } from "storybook-dark-mode";

import { PriceChart } from "./price-chart";
import series from "./price-chart.stories.json";

type Range = "1D" | "7D" | "1M" | "3M" | "1Y" | "ALL";
type Asset = "BTC" | "ETH";

export default {
  title: "Charts/PriceChart",
  component: PriceChart,
} as ComponentMeta<typeof PriceChart>;

const Template: ComponentStory<typeof PriceChart> = (args) => {
  const theme = useDarkMode() ? "dark" : "light";
  const [asset, setAsset] = useState<Asset>("BTC");
  const [range, setRange] = useState<Range>("1D");

  const data = series[asset][range].map((d) => ({
    date: new Date(1000 * d.time),
    price: d.price,
  }));

  return (
    <div
      style={{
        resize: "both",
        overflow: "scroll",
        width: "600px",
        height: "400px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        <div>
          <ButtonGroup style={{ marginBottom: 12 }}>
            <Button
              text="BTC"
              active={asset === "BTC"}
              onClick={() => {
                setAsset("BTC");
              }}
            />
            <Button
              text="ETH"
              active={asset === "ETH"}
              onClick={() => {
                setAsset("ETH");
              }}
            />
          </ButtonGroup>
        </div>
        <ButtonGroup style={{ marginBottom: 12 }}>
          <Button
            text="1D"
            active={range === "1D"}
            onClick={() => {
              setRange("1D");
            }}
          />
          <Button
            text="7D"
            active={range === "7D"}
            onClick={() => {
              setRange("7D");
            }}
          />
          <Button
            text="1M"
            active={range === "1M"}
            onClick={() => {
              setRange("1M");
            }}
          />
          <Button
            text="3M"
            active={range === "3M"}
            onClick={() => {
              setRange("3M");
            }}
          />
          <Button
            text="1Y"
            active={range === "1Y"}
            onClick={() => {
              setRange("1Y");
            }}
          />
          <Button
            text="ALL"
            active={range === "ALL"}
            onClick={() => {
              setRange("ALL");
            }}
          />
        </ButtonGroup>
      </div>
      <div
        style={{
          flex: 1,
        }}
      >
        <PriceChart data={data} theme={theme} />
      </div>
    </div>
  );
};

export const Primary = Template.bind({});
