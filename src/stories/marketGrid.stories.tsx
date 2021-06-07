import {
  ApolloClient,
  ApolloProvider,
  HttpLink,
  InMemoryCache,
  split,
  useQuery,
} from "@apollo/client";
import { WebSocketLink } from "@apollo/client/link/ws";
import { getMainDefinition } from "@apollo/client/utilities";
import { Meta, Story } from "@storybook/react";
import React, { useMemo } from "react";

import { Chart } from "../components/chart";
import { Interval } from "../types";
import {
  marketDetail,
  marketDetailQuery,
  marketDetailVariables,
  markets,
} from "./api/vega-graphql";
import { marketsQuery } from "./api/vega-graphql/queries/markets";
import { MarketGrid } from "./components/market-grid/market-grid";
import { VegaDataSource } from "./data-source/vega-protocol-data-source";

export default {
  title: "Overview/Use Cases",
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

const marketList = [
  "3C58ED2A4A6C5D7E",
  "2839D9B2329C9E70",
  "2839D9B2329C9E70",
  "3C58ED2A4A6C5D7E",
  "3C58ED2A4A6C5D7E",
  "2839D9B2329C9E70",
];

const Grid = () => {
  const { data, loading } = useQuery<markets>(marketsQuery, {
    errorPolicy: "ignore",
  });

  if (loading || typeof data === "undefined" || data.markets === null) {
    return <div>Loading</div>;
  }

  return <MarketGrid markets={data.markets} />;
};

export const Simple = () => (
  <ApolloProvider client={client}>
    <Grid />
  </ApolloProvider>
);
