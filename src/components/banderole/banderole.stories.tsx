import "./banderole.css";

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
        resize: "both",
        overflow: "scroll",
      }}
    >
      <Banderole {...args}>
        {views.map((view) => (
          <div
            key={view.id}
            style={{
              background: "rgb(30,30,30)",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {view.id}
          </div>
        ))}
      </Banderole>
    </div>
  );
};

export const Vertical = Template.bind({});
Vertical.args = {
  numViews: 2,
  vertical: true,
};

export const Horizontal = Template.bind({});
Horizontal.args = {
  numViews: 2,
  vertical: false,
};

export const Nested: Story = (args) => {
  return (
    <div
      style={{
        width: "80vw",
        height: "80vh",
        resize: "both",
        overflow: "scroll",
      }}
    >
      <Banderole minSize={100} snap>
        <div
          style={{
            background: "rgb(30,30,30)",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Banderole vertical minSize={100}>
            <div
              style={{
                background: "rgb(30,30,30)",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              One
            </div>
            <div
              style={{
                background: "rgb(30,30,30)",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Two
            </div>
          </Banderole>
        </div>
        <div
          style={{
            background: "rgb(30,30,30)",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Three
        </div>
      </Banderole>
    </div>
  );
};
Nested.args = {};
