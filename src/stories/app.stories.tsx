import "./app.stories.scss";

import { ApolloClient, HttpLink, InMemoryCache, split } from "@apollo/client";
import { Button, MenuItem } from "@blueprintjs/core";
import { ItemRenderer, Select } from "@blueprintjs/select";
import { Meta, Story } from "@storybook/react";

import { ApolloDataSource } from "../data/vega-protocol-data-source";
import { Chart } from "../components/chart";
import { ChartInterface } from "../types";
import { CryptoCompareDataSource } from "../data/crypto-compare-data-source";
import { Interval } from "../api/vega-graphql";
import React from "react";
import { WebSocketLink } from "@apollo/client/link/ws";
import data from "./app.stories.json";
import { getMainDefinition } from "@apollo/client/utilities";

export default {
  title: "Overview/Application Examples",
} as Meta;

const httpLink = new HttpLink({
  uri: "https://n04.d.vega.xyz/query",
});

const wsLink = new WebSocketLink({
  uri: "wss://n04.d.vega.xyz/query",
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

type Study = { id: "bollinger" | "macd" | "none" | "volume"; label: string };

const MarketSelect = Select.ofType<Market>();
const StudySelect = Select.ofType<Study>();

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

const renderStudy: ItemRenderer<Study> = (
  study: Study,
  { handleClick, modifiers }: any
) => {
  if (!modifiers.matchesPredicate) {
    return null;
  }
  return (
    <MenuItem
      active={modifiers.active}
      key={study.id}
      onClick={handleClick}
      text={study.label}
    />
  );
};

const studies: Study[] = [
  { id: "none", label: "None" },
  { id: "volume", label: "Volume" },
  { id: "macd", label: "Macd" },
  { id: "bollinger", label: "Bollinger Bands" },
];

export const VegaProtocol: Story = () => {
  const ref = React.useRef<ChartInterface>(null!);
  const [market, setMarket] = React.useState(data.markets[1].id);
  const [study, setStudy] = React.useState(studies[0].id);
  const [interval, setInterval] = React.useState(Interval.I15M);

  const dataSource = React.useMemo(
    () => new ApolloDataSource(client, market, 5),
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
        <StudySelect
          items={studies}
          itemRenderer={renderStudy}
          onItemSelect={(item: Study) => {
            setStudy(item.id);
          }}
          noResults={<MenuItem disabled={true} text="No results." />}
          filterable={false}
        >
          <Button
            text={
              studies.find((s) => s.id === study)?.label ?? "No study selected"
            }
            disabled={false}
          />
        </StudySelect>
        <Button
          icon="refresh"
          intent="primary"
          text="Reset"
          onClick={() => {
            ref.current.reset();
          }}
        />
      </div>
      <div style={{ height: "40vh" }}>
        <Chart
          ref={ref}
          dataSource={dataSource}
          study={study === "none" ? undefined : study}
          interval={interval}
          onSetInterval={setInterval}
        />
      </div>
    </div>
  );
};

export const CryptoCompare: Story = () => {
  const ref = React.useRef<ChartInterface>(null!);
  const [study, setStudy] = React.useState(studies[0].id);
  const [interval, setInterval] = React.useState(Interval.I1M);

  const dataSource = React.useMemo(() => new CryptoCompareDataSource(), []);

  return (
    <div className="container bp3-dark">
      <h1>Crypto Compare Charts</h1>
      <div className="content-wrapper">
        <StudySelect
          items={studies}
          itemRenderer={renderStudy}
          onItemSelect={(item: Study) => {
            setStudy(item.id);
          }}
          noResults={<MenuItem disabled={true} text="No results." />}
          filterable={false}
        >
          <Button
            text={
              studies.find((s) => s.id === study)?.label ?? "No study selected"
            }
            disabled={false}
          />
        </StudySelect>
        <Button
          icon="refresh"
          intent="primary"
          text="Reset"
          onClick={() => {
            ref.current.reset();
          }}
        />
      </div>
      <div style={{ height: "40vh" }}>
        <Chart
          ref={ref}
          dataSource={dataSource}
          study={study === "none" ? undefined : study}
          interval={interval}
          onSetInterval={setInterval}
        />
      </div>
    </div>
  );
};
