import "./app.stories.scss";

import { ApolloClient, HttpLink, InMemoryCache, split } from "@apollo/client";
import { Button, Intent, MenuItem } from "@blueprintjs/core";
import { ChartType, Overlay, Study } from "../types";
import { ItemRenderer, Select } from "@blueprintjs/select";
import { Meta, Story } from "@storybook/react";

import { ApolloDataSource } from "./data-source/vega-protocol-data-source";
import { AppToaster } from "./components/toaster";
import { Chart } from "../components/chart";
import { ChartControls } from "./components/chart-controls";
import { ChartInterface } from "../types";
import { CryptoCompareDataSource } from "./data-source/crypto-compare-data-source";
import { Interval } from "./api/vega-graphql";
import React from "react";
import { WebSocketLink } from "@apollo/client/link/ws";
import data from "./app.stories.json";
import { getMainDefinition } from "@apollo/client/utilities";

export default {
  title: "Overview/Application Examples",
} as Meta;

const httpLink = new HttpLink({
  uri: "https://lb.testnet.vega.xyz/query",
});

const wsLink = new WebSocketLink({
  uri: "wss://lb.testnet.vega.xyz/query",
  options: {
    reconnect: true,
  },
});

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink,
  httpLink
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

type Market = {
  id: string;
  tradableInstrument: { instrument: { name: string } };
};

const MarketSelect = Select.ofType<Market>();

const renderMarket: ItemRenderer<any> = (
  market: Market,
  { handleClick, modifiers }: any
) => {
  if (!modifiers.matchesPredicate) {
    return null;
  }
  return (
    <MenuItem
      active={modifiers.active}
      key={market.id}
      label={market.tradableInstrument.instrument.name}
      onClick={handleClick}
      text={market.tradableInstrument.instrument.name}
    />
  );
};

export const VegaProtocol: Story = () => {
  const ref = React.useRef<ChartInterface>(null!);
  const [market, setMarket] = React.useState(data.markets[1].id);
  const [chartType, setChartType] = React.useState<ChartType>("area");
  const [study, setStudy] = React.useState<Study | null>(null);
  const [overlay, setOverlay] = React.useState<Overlay | null>(null);
  const [interval, setInterval] = React.useState(Interval.I15M);

  const dataSource = React.useMemo(
    () =>
      new ApolloDataSource(
        client,
        market,
        "",
        5
      ),
    [market]
  );

  return (
    <div className="container bp3-dark">
      <h1>Vega Protocol Charts</h1>
      <div className="content-wrapper">
        <MarketSelect
          items={data.markets}
          itemRenderer={renderMarket}
          onItemSelect={(item: Market) => {
            setMarket(item.id);
          }}
          noResults={<MenuItem disabled={true} text="No results." />}
          filterable={false}
        >
          <Button
            text={
              data.markets.find((s) => s.id === market)?.tradableInstrument
                .instrument.name ?? "No market selected"
            }
            disabled={false}
          />
        </MarketSelect>
      </div>
      <div>
        <ChartControls
          interval={interval}
          chartType={chartType}
          overlay={overlay}
          study={study}
          onSetInterval={setInterval}
          onSetChartType={setChartType}
          onSetOverlay={setOverlay}
          onSetStudy={setStudy}
          onSnapshot={async () => {
            const blob = await ref.current.snapshot();

            if (blob) {
              if (navigator.clipboard) {
                await navigator?.clipboard?.write?.([
                  new ClipboardItem({ "image/png": blob }),
                ]);

                AppToaster.show({
                  intent: Intent.SUCCESS,
                  message: "Copied to clipboard",
                });
              } else {
                console.log("Clipboard API not found");
              }
            }
          }}
        />
      </div>
      <div style={{ height: "60vh" }}>
        <Chart
          ref={ref}
          dataSource={dataSource}
          chartType={chartType}
          study={study === null ? undefined : study}
          overlay={overlay === null ? undefined : overlay}
          interval={interval}
        />
      </div>
    </div>
  );
};

export const CryptoCompare: Story = () => {
  const ref = React.useRef<ChartInterface>(null!);
  const [chartType, setChartType] = React.useState<ChartType>("candle");
  const [study, setStudy] = React.useState<Study | null>(null);
  const [overlay, setOverlay] = React.useState<Overlay | null>(null);
  const [interval, setInterval] = React.useState(Interval.I1M);

  const dataSource = React.useMemo(() => new CryptoCompareDataSource(), []);

  return (
    <div className="container bp3-dark">
      <h1>Crypto Compare Charts</h1>
      <ChartControls
        interval={interval}
        chartType={chartType}
        overlay={overlay}
        study={study}
        onSetInterval={setInterval}
        onSetChartType={setChartType}
        onSetOverlay={setOverlay}
        onSetStudy={setStudy}
        onSnapshot={async () => {
          const blob = await ref.current.snapshot();

          if (blob) {
            if (navigator.clipboard) {
              await navigator?.clipboard?.write?.([
                new ClipboardItem({ "image/png": blob }),
              ]);

              AppToaster.show({
                intent: Intent.SUCCESS,
                message: "Copied to clipboard",
              });
            } else {
              console.log("Clipboard API not found");
            }
          }
        }}
      />
      <div style={{ height: "40vh" }}>
        <Chart
          ref={ref}
          dataSource={dataSource}
          chartType={chartType}
          study={study === null ? undefined : study}
          overlay={overlay === null ? undefined : overlay}
          interval={interval}
        />
      </div>
    </div>
  );
};
