import "./global.css";

import { themes } from "@storybook/theming";
import { useDarkMode } from "storybook-dark-mode";
import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";
import classNames from "classnames";

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
      order: ["Overview", "Charts", "Components"],
    },
  },
};

const client = new ApolloClient({
  uri: "https://api.n08.testnet.vega.xyz/graphql",
  cache: new InMemoryCache(),
});

export const decorators = [
  (Story) => {
    const darkmode = useDarkMode();

    return (
      <ApolloProvider client={client}>
        <div
          data-theme={darkmode ? "dark" : "light"}
          className={classNames({ ["bp4-dark"]: darkmode })}
        >
          <Story />
        </div>
      </ApolloProvider>
    );
  },
];
