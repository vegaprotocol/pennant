import { Button, ButtonGroup } from "@blueprintjs/core";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { intersectionBy, zipWith } from "lodash";
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

export const Primary: ComponentStory<typeof PriceChart> = () => {
  const theme = useDarkMode() ? "dark" : "light";
  const [asset, setAsset] = useState<Asset>("BTC");
  const [range, setRange] = useState<Range>("1D");

  const data: { cols: string[]; rows: [Date, ...number[]][] } = {
    cols: ["Date", asset],
    rows: series[asset][range].map((d) => [new Date(1000 * d.time), d.price]),
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

export const Comparison: ComponentStory<typeof PriceChart> = () => {
  const theme = useDarkMode() ? "dark" : "light";
  const [asset, setAsset] = useState<Set<Asset>>(new Set(["BTC", "ETH"]));
  const [range, setRange] = useState<Range>("1D");

  const data: { cols: string[]; rows: [Date, ...number[]][] } = {
    cols: ["Date", "BTC", "ETH", "ETH2"],
    rows: zipWith(
      series["BTC"][range].map((d) => new Date(1000 * d.time)),
      series["BTC"][range].map((d) => d.price),
      series["ETH"][range].map((d) => 13 * d.price),
      series["ETH"][range].map((d) => 12.5 * d.price),
      function (a, b, c, d) {
        const res: [Date, ...number[]] = [a];

        if (asset.has("BTC")) {
          res.push(b);
        }

        if (asset.has("ETH")) {
          res.push(c);
        }

        if (asset.has("ETH")) {
          res.push(d);
        }

        return res;
      }
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
              active={asset.has("BTC")}
              onClick={() => {
                if (asset.has("BTC")) {
                  setAsset((asset) => {
                    const newAsset = new Set(asset);

                    newAsset.delete("BTC");

                    return newAsset;
                  });
                } else {
                  setAsset((asset) => {
                    const newAsset = new Set(asset);

                    newAsset.add("BTC");

                    return newAsset;
                  });
                }
              }}
            />
            <Button
              text="ETH"
              active={asset.has("ETH")}
              onClick={() => {
                if (asset.has("ETH")) {
                  setAsset((asset) => {
                    const newAsset = new Set(asset);

                    newAsset.delete("ETH");

                    return newAsset;
                  });
                } else {
                  setAsset((asset) => {
                    const newAsset = new Set(asset);

                    newAsset.add("ETH");

                    return newAsset;
                  });
                }
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
