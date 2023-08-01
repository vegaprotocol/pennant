import "./market-grid.css";

import { ApolloClient, HttpLink, InMemoryCache, split } from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { Icon } from "@blueprintjs/core";
import { Interval } from "@util/types";
import { createClient } from "graphql-ws";
import { useMemo } from "react";
import { useDarkMode } from "storybook-dark-mode";

import { CandlestickChart } from "../../../feature/candlestick-chart";
import { MarketFieldsFragment } from "../../data-source/__generated__/markets";
import { VegaDataSource } from "../../data-source/vega-protocol-data-source";

const httpLink = new HttpLink({
  uri: "https://api.n07.testnet.vega.xyz/graphql",
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: "wss://api.n07.testnet.vega.xyz/graphql",
  }),
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
  httpLink,
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

export type MarketGridProps = {
  markets: MarketFieldsFragment[];
};

export const MarketGrid = ({ markets }: MarketGridProps) => {
  const darkmode = useDarkMode();

  const dataSources = useMemo(
    () =>
      markets.map(
        (market) =>
          new VegaDataSource(
            client,
            market.id,
            "0a0ed5f704cf29041bfa320b1015b0b0c0eedb101954ecd687e513d8472a3ff6",
          ),
      ),
    [markets],
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
            <div className="bp4-ui-text">
              {market.tradableInstrument.instrument.code}
            </div>
            <Icon icon="more" />
          </div>
          <div className="bp4-ui-text text-muted" style={{ fontSize: "12px" }}>
            {market.tradableInstrument.instrument.name}
          </div>
          <div style={{ flex: "1 1 0" }}>
            <CandlestickChart
              key={market.id}
              dataSource={dataSources[i]}
              interval={Interval.I1M}
              options={{
                simple: true,
                initialNumCandlesToDisplay: 25,
                initialNumCandlesToFetch: 10000,
              }}
              theme={darkmode ? "dark" : "light"}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
