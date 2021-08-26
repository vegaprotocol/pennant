import { Meta, Story } from "@storybook/react";
import { range } from "d3-array";

import { Banderole, BanderoleProps } from "./banderole";

export default {
  title: "Components/Banderole",
  Component: Banderole,
  argTypes: {
    numViews: {
      control: { type: "number", min: 1, max: 10, step: 1 },
    },
  },
} as Meta;

const Template: Story<BanderoleProps & { numViews: number }> = ({
  numViews,
  ...args
}) => {
  const views = range(0, numViews).map((n) => ({ id: String(n) }));

  return (
    <div
      style={{
        width: "80vw",
        height: "80vh",
      }}
    >
      <Banderole {...args}>
        {views.map((view) => (
          <div
            key={view.id}
            style={{ border: "1px solid #3d3d3d", height: "100%" }}
          >
            {view.id}
          </div>
        ))}
      </Banderole>
    </div>
  );
};

export const Basic = Template.bind({});
Basic.args = {
  numViews: 2,
  vertical: true,
};
