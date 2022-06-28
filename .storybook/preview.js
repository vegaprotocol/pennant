import "./global.css";

import { themes } from "@storybook/theming";
import { useDarkMode } from "storybook-dark-mode";

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

export const decorators = [
  (Story) => {
    return (
      <div data-theme={useDarkMode() ? "dark" : "light"}>
        <Story />
      </div>
    );
  },
];
