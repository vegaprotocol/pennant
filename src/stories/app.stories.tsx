import "./app.stories.scss";

import { ApolloClient, HttpLink, InMemoryCache, split } from "@apollo/client";
import { Button, MenuItem } from "@blueprintjs/core";
import { ItemRenderer, Select } from "@blueprintjs/select";
import { Meta, Story } from "@storybook/react";

import { ApolloDataSource } from "../data/apollo-data-source";
import { Chart } from "../components/chart";
import { CryptoCompareDataSource } from "../data/crypto-compare-data-source copy";
import { Interval } from "../api/vega-graphql";
import React from "react";
import { WebSocketLink } from "@apollo/client/link/ws";
import data from "./app.stories.json";
import { getMainDefinition } from "@apollo/client/utilities";

export default {
  title: "Example/Application",
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

const MarketSelect = Select.ofType<any>();

const renderMarket: ItemRenderer<any> = (
  market: any,
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

export const SimpleWebpage: Story = () => {
  const ref = React.useRef<{ reset(): void }>(null!);
  const [market, setMarket] = React.useState(data.markets[1].id);
  const [interval, setInterval] = React.useState(Interval.I15M);

  const dataSource = React.useMemo(
    () => new ApolloDataSource(client, market, 5),
    [market]
  );

  return (
    <div className="container bp3-dark">
      <h1>Console Charts</h1>
      <div className="content-wrapper">
        <MarketSelect
          items={data.markets}
          itemRenderer={renderMarket}
          onItemSelect={(item: any) => {
            setMarket(item);
          }}
          noResults={<MenuItem disabled={true} text="No results." />}
          filterable={false}
        >
          <Button
            text={
              data.markets[0].tradableInstrument.instrument.name ??
              "No market selected"
            }
            disabled={false}
          />
        </MarketSelect>
        <Button
          icon="refresh"
          intent="primary"
          text="Reset"
          onClick={() => {
            ref.current.reset();
          }}
        />
      </div>
      <div style={{ height: "60vh" }}>
        <Chart
          ref={ref}
          dataSource={dataSource}
          interval={interval}
          onSetInterval={setInterval}
        />
      </div>
    </div>
  );
};

export const CryptoCompareExample: Story = () => {
  const ref = React.useRef<{ reset(): void }>(null!);
  const [interval, setInterval] = React.useState(Interval.I1M);

  const dataSource = React.useMemo(() => new CryptoCompareDataSource(), []);

  return (
    <div className="container bp3-dark">
      <h1>Console Charts</h1>
      <div className="content-wrapper">
        <Button
          icon="refresh"
          intent="primary"
          text="Reset"
          onClick={() => {
            ref.current.reset();
          }}
        />
      </div>
      <div style={{ height: "60vh" }}>
        <Chart
          ref={ref}
          dataSource={dataSource}
          interval={interval}
          onSetInterval={setInterval}
        />
      </div>
    </div>
  );
};
