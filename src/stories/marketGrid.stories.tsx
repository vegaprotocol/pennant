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

import { MarketGrid } from "./components/market-grid/market-grid";
import {
  MarketsDocument,
  MarketsQuery,
  MarketsQueryVariables,
} from "./data-source/__generated__/markets";

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

const Grid: Story = () => {
  const { data, loading } = useQuery<MarketsQuery, MarketsQueryVariables>(
    MarketsDocument,
    { fetchPolicy: "no-cache" },
  );

  if (
    loading ||
    typeof data === "undefined" ||
    data.marketsConnection === undefined ||
    data.marketsConnection === null
  ) {
    return <div>Loading</div>;
  }

  return (
    <MarketGrid
      markets={data.marketsConnection.edges.map((edge) => edge.node)}
    />
  );
};

export const Simple = () => (
  <ApolloProvider client={client}>
    <Grid />
  </ApolloProvider>
);
