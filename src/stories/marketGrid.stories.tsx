import {
  ApolloClient,
  ApolloProvider,
  HttpLink,
  InMemoryCache,
  split,
  useQuery,
} from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { Meta, Story } from "@storybook/react";
import { createClient } from "graphql-ws";

import { markets } from "./api/vega-graphql";
import { marketsQuery } from "./api/vega-graphql/queries/markets";
import { MarketGrid } from "./components/market-grid/market-grid";

export default {
  title: "Overview/Use Cases",
} as Meta;

const VEGA_URL = "api.n11.testnet.vega.xyz/graphql";

const httpLink = new HttpLink({
  uri: `https://${VEGA_URL}`,
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: `wss://${VEGA_URL}`,
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

const Grid: Story = () => {
  const { data, loading } = useQuery<markets>(marketsQuery);

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
