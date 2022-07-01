import "./market-grid.css";

import { ApolloClient, HttpLink, InMemoryCache, split } from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { Icon } from "@blueprintjs/core";
import { createClient } from "graphql-ws";
import { useMemo } from "react";

import { Chart } from "../../../components/chart";
import { Interval } from "../../../types";
import { markets_markets } from "../../api/vega-graphql";
import { VegaDataSource } from "../../data-source/vega-protocol-data-source";

const httpLink = new HttpLink({
  uri: "https://lb.testnet.vega.xyz/query",
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: "wss://lb.testnet.vega.xyz/query",
  })
);

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

export type MarketGridProps = {
  markets: markets_markets[];
};

export const MarketGrid = ({ markets }: MarketGridProps) => {
  const dataSources = useMemo(
    () =>
      markets.map(
        (market) =>
          new VegaDataSource(
            client,
            market.id,
            "0a0ed5f704cf29041bfa320b1015b0b0c0eedb101954ecd687e513d8472a3ff6",
            console.log
          )
      ),
    [markets]
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gridAutoRows: "1fr",
        gap: "1px",
        height: "100%",
      }}
    >
      {markets.map((market, i) => (
        <div
          key={market.id}
          style={{
            display: "flex",
            flexDirection: "column",
            backgroundColor: "black",
            padding: "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <div>{market.name}</div>
            <Icon icon="more" />
          </div>
          <div className="text-muted" style={{ fontSize: "12px" }}>
            {market.tradableInstrument.instrument.code}
          </div>
          <div style={{ flex: "1 1 0" }}>
            <Chart
              key={market.id}
              dataSource={dataSources[i]}
              interval={Interval.I1M}
              options={{
                simple: true,
                initialNumCandlesToDisplay: 25,
                initialNumCandlesToFetch: 10000,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
