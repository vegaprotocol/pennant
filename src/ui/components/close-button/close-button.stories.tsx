import { ComponentMeta } from "@storybook/react";

import { CloseButton } from "./close-button";

export default {
  title: "Components/CloseButton",
  component: CloseButton,
} as ComponentMeta<typeof CloseButton>;

export const Primary = () => <CloseButton title="Close study" />;
