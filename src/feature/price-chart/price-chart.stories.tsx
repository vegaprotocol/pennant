import { Button, ButtonGroup } from "@blueprintjs/core";
import { useCallback } from "@storybook/addons";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { CustomTooltip as Tooltip } from "@ui/components";
import { useState } from "react";
import { useDarkMode } from "storybook-dark-mode";

import coinmarketcap from "../../data/coinmarketcap-data.json";
import vega from "../../data/vega-data.json";
import { PriceChart } from "./price-chart";

type Range = "1D" | "7D" | "1M" | "3M" | "1Y" | "ALL";
type Asset = "BTC" | "ETH" | "TETHER";

export default {
  title: "Charts/PriceChart",
  component: PriceChart,
} as ComponentMeta<typeof PriceChart>;

export const SingleSeries: ComponentStory<typeof PriceChart> = () => {
  const theme = useDarkMode() ? "dark" : "light";
  const [asset, setAsset] = useState<Asset>("BTC");
  const [range, setRange] = useState<Range>("1D");

  const data: { cols: readonly [string, string]; rows: [Date, number][] } = {
    cols: ["Date", asset] as const,
    rows: (coinmarketcap as any)[asset][range].map(
      (d: { price: number; time: number }) =>
        [new Date(1000 * d.time), d.price] as const,
    ),
  };

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
            <Button
              text="TETHER"
              active={asset === "TETHER"}
              onClick={() => {
                setAsset("TETHER");
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

export const CustomTooltip: ComponentStory<typeof PriceChart> = () => {
  const theme = useDarkMode() ? "dark" : "light";
  const [asset, setAsset] = useState<Asset>("BTC");
  const [range, setRange] = useState<Range>("1D");

  const data: { cols: [string, string]; rows: [Date, number][] } = {
    cols: ["Date", asset],
    rows: (coinmarketcap as any)[asset][range].map((d: any) => [
      new Date(1000 * d.time),
      d.price,
    ]),
  };

  const annotations: Array<Array<{ volume: number; marketCap: number }>> = (
    coinmarketcap as any
  )[asset][range].map((d: any) => [
    {
      volume: d.volume,
      marketCap: d.marketCap,
    },
  ]);

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
            <Button
              text="TETHER"
              active={asset === "TETHER"}
              onClick={() => {
                setAsset("TETHER");
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
        <PriceChart
          data={data}
          annotations={annotations}
          theme={theme}
          tooltip={Tooltip}
        />
      </div>
    </div>
  );
};

export const Vega1: ComponentStory<typeof PriceChart> = () => {
  const theme = useDarkMode() ? "dark" : "light";

  const data: { cols: [string, string]; rows: [Date, number][] } = {
    cols: vega[0].cols as [string, string],
    rows: vega[0].rows.map((d) => [new Date(d[0]), d[1] as number]),
  };

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
      <PriceChart data={data} theme={theme} />
    </div>
  );
};

export const Vega2: ComponentStory<typeof PriceChart> = () => {
  const theme = useDarkMode() ? "dark" : "light";

  const priceFormat = useCallback((price: number) => price.toFixed(2), []);

  const data: { cols: [string, string]; rows: [Date, number][] } = {
    cols: vega[1].cols as [string, string],
    rows: vega[1].rows.map((d) => [new Date(d[0]), d[1] as number]),
  };

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
      <PriceChart data={data} theme={theme} priceFormat={priceFormat} />
    </div>
  );
};

export const NonInteractive: ComponentStory<typeof PriceChart> = () => {
  const theme = useDarkMode() ? "dark" : "light";

  const priceFormat = useCallback((price: number) => price.toFixed(2), []);

  const data: { cols: [string, string]; rows: [Date, number][] } = {
    cols: vega[1].cols as [string, string],
    rows: vega[1].rows.map((d) => [new Date(d[0]), d[1] as number]),
  };

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
      <PriceChart
        data={data}
        theme={theme}
        priceFormat={priceFormat}
        interactive={false}
      />
    </div>
  );
};
