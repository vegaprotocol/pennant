import { Meta, Story } from "@storybook/react";
import React from "react";

import styles from "./colors.module.css";
import { ColorGrid } from "./components/color-grid";
import { ColorSample } from "./components/color-sample";

export default {
  title: "Colors",
} as Meta;

const shades = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
];

export const Colors: Story = () => {
  const cssStyleDeclaration = getComputedStyle(document.documentElement);

  return (
    <div className={styles.container}>
      <div className={styles.paletteGrid}>
        <ColorGrid title="Gray">
          {shades.map((shade) => {
            const color = cssStyleDeclaration.getPropertyValue(
              `--pennant-color-gray-${shade}`
            );

            return <ColorSample hex={color} name={shade} />;
          })}
        </ColorGrid>
        <ColorGrid title="Vega green">
          {shades.map((shade) => {
            const color = cssStyleDeclaration.getPropertyValue(
              `--pennant-color-vega-green-${shade}`
            );

            return <ColorSample hex={color} name={shade} />;
          })}
        </ColorGrid>
        <ColorGrid title="Vega red">
          {shades.map((shade) => {
            const color = cssStyleDeclaration.getPropertyValue(
              `--pennant-color-vega-red-${shade}`
            );

            return <ColorSample hex={color} name={shade} />;
          })}
        </ColorGrid>
      </div>
    </div>
  );
};
