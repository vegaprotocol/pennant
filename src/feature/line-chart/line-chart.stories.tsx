import { Button, ButtonGroup } from "@blueprintjs/core";
import { useCallback } from "@storybook/addons";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { CustomTooltip as Tooltip } from "@ui/components";
import { numberFormatter } from "@util/misc";
import { zipWith } from "lodash";
import { useState } from "react";
import { useDarkMode } from "storybook-dark-mode";

import coinmarketcap from "../../data/coinmarketcap-data.json";
import lineData from "../../data/line-chart.json";
import vectorVals from "../../data/vectorVals.json";
import vega from "../../data/vega-data.json";
import { LineChart, Row } from "./line-chart";

type Range = "1D" | "7D" | "1M" | "3M" | "1Y" | "ALL";
type Asset = "BTC" | "ETH" | "TETHER";
type VectorVal = "bid" | "ask";

export default {
  title: "Charts/LineChart",
  component: LineChart,
} as ComponentMeta<typeof LineChart>;

export const SingleSeries: ComponentStory<typeof LineChart> = () => {
  const theme = useDarkMode() ? "dark" : "light";
  const [asset, setAsset] = useState<Asset>("BTC");
  const [range, setRange] = useState<Range>("1D");

  const data: { cols: string[]; rows: [Date, ...number[]][] } = {
    cols: ["Date", asset],
    rows: (coinmarketcap as any)[asset][range].map((d: any) => [
      new Date(1000 * d.time),
      d.price,
    ]),
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
        <LineChart data={data} theme={theme} />
      </div>
    </div>
  );
};

export const MultipleSeries: ComponentStory<typeof LineChart> = () => {
  const theme = useDarkMode() ? "dark" : "light";
  const [asset, setAsset] = useState<Set<Asset>>(new Set(["BTC", "ETH"]));
  const [range, setRange] = useState<Range>("1Y");

  const cols = ["Date", ...Array.from(asset).sort()];

  const data: { cols: string[]; rows: [Date, ...number[]][] } = {
    cols: cols,
    rows: zipWith(
      coinmarketcap["BTC"][range].map((d) => new Date(1000 * d.time)),
      coinmarketcap["BTC"][range].map((d) => d.price),
      coinmarketcap["ETH"][range].map((d) => d.price),
      (coinmarketcap as any)["TETHER"][range].map(
        (d: any) => d.price as number,
      ) as number[],
      function (a, b, c, d) {
        const res: [Date, ...number[]] = [a];

        if (asset.has("BTC")) {
          res.push(b);
        }

        if (asset.has("ETH")) {
          res.push(c);
        }

        if (asset.has("TETHER")) {
          res.push(d);
        }

        return res;
      },
    ).slice(0, coinmarketcap["BTC"][range].length),
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
            <Button
              text="TETHER"
              active={asset.has("TETHER")}
              onClick={() => {
                if (asset.has("TETHER")) {
                  setAsset((asset) => {
                    const newAsset = new Set(asset);

                    newAsset.delete("TETHER");

                    return newAsset;
                  });
                } else {
                  setAsset((asset) => {
                    const newAsset = new Set(asset);

                    newAsset.add("TETHER");

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
          flex: "1 1 0",
          position: "relative",
          left: 0,
          top: 0,
        }}
      >
        <LineChart data={data} theme={theme} />
      </div>
    </div>
  );
};

export const MortalityRates: ComponentStory<typeof LineChart> = () => {
  const theme = useDarkMode() ? "dark" : "light";

  const cols = ["Age", "UK", "UK-Scotland", "Scotland"] as const;

  const rows = lineData.mortality_rates.map(
    (d) => [d["Age"], ...cols.slice(1).map((col) => d[col])] as Row,
  );

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
      <LineChart
        data={{ cols, rows }}
        theme={theme}
        xFormat={numberFormatter(0).format}
      />
    </div>
  );
};

export const FTSE: ComponentStory<typeof LineChart> = () => {
  const theme = useDarkMode() ? "dark" : "light";

  const cols = ["Date", "FTSE All Share (p)"];
  const rows = lineData.ftse.map(
    (d) => [new Date(d["Date"]), d["FTSE All Share (p)"]] as const,
  );

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
      <LineChart data={{ cols, rows }} theme={theme} />
    </div>
  );
};

export const CustomTooltip: ComponentStory<typeof LineChart> = () => {
  const theme = useDarkMode() ? "dark" : "light";
  const [asset, setAsset] = useState<Asset>("BTC");
  const [range, setRange] = useState<Range>("1D");

  const data: { cols: string[]; rows: [Date, ...number[]][] } = {
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
        <LineChart
          data={data}
          annotations={annotations}
          theme={theme}
          tooltip={Tooltip}
        />
      </div>
    </div>
  );
};

export const Vega1: ComponentStory<typeof LineChart> = () => {
  const theme = useDarkMode() ? "dark" : "light";

  const data: { cols: string[]; rows: [Date, ...number[]][] } = {
    cols: vega[0].cols,
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
      <LineChart data={data} theme={theme} />
    </div>
  );
};

export const Vega2: ComponentStory<typeof LineChart> = () => {
  const theme = useDarkMode() ? "dark" : "light";

  const priceFormat = useCallback((price: number) => price.toFixed(2), []);

  const data: { cols: string[]; rows: [Date, ...number[]][] } = {
    cols: vega[1].cols,
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
      <LineChart data={data} theme={theme} priceFormat={priceFormat} />
    </div>
  );
};

export const VectorVals: ComponentStory<typeof LineChart> = () => {
  const theme = useDarkMode() ? "dark" : "light";
  const [vectorVal, setVectorVal] = useState<VectorVal>("bid");

  const priceFormat = useCallback((price: number) => price.toFixed(2), []);

  const data: { cols: string[]; rows: [Date, ...number[]][] } = {
    cols: [`${vectorVal} offset`, `${vectorVal} probability`],
    rows: zipWith<any, any>(
      vectorVals.stateVariableProposal.proposal.kvb[vectorVal === "bid" ? 0 : 2]
        .value.vectorVal.value,
      vectorVals.stateVariableProposal.proposal.kvb[
        (vectorVal === "bid" ? 0 : 2) + 1
      ].value.vectorVal.value,
      function (a, b) {
        return [+a, +b];
      },
    ),
  };

  return (
    <div>
      <ButtonGroup style={{ marginBottom: 12 }}>
        <Button
          text="Bid"
          active={vectorVal === "bid"}
          onClick={() => {
            setVectorVal("bid");
          }}
        />
        <Button
          text="Ask"
          active={vectorVal === "ask"}
          onClick={() => {
            setVectorVal("ask");
          }}
        />
      </ButtonGroup>
      <div
        style={{
          resize: "both",
          overflow: "scroll",
          width: "400px",
          height: "120px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <LineChart data={data} theme={theme} priceFormat={priceFormat} />
      </div>
    </div>
  );
};

export const NonInteractive: ComponentStory<typeof LineChart> = () => {
  const theme = useDarkMode() ? "dark" : "light";

  const priceFormat = useCallback((price: number) => price.toFixed(2), []);

  const data: { cols: string[]; rows: [Date, ...number[]][] } = {
    cols: vega[1].cols,
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
      <LineChart
        data={data}
        theme={theme}
        priceFormat={priceFormat}
        interactive={false}
      />
    </div>
  );
};
