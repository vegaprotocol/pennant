import "./global.css";

import { themes } from "@storybook/theming";
import { useDarkMode } from "storybook-dark-mode";
import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  backgrounds: { disable: true },
  darkMode: {
    stylePreview: true,
  },
  docs: {
    theme: themes.dark,
  },
  options: {
    storySort: {
      order: ["Overview", "Components"],
    },
  },
};

const client = new ApolloClient({
  uri: "https://n03.stagnet2.vega.xyz/query",
  cache: new InMemoryCache(),
});

export const decorators = [
  (Story) => {
    return (
      <ApolloProvider client={client}>
        <div data-theme={useDarkMode() ? "dark" : "light"}>
          <Story />
        </div>
      </ApolloProvider>
    );
  },
];
