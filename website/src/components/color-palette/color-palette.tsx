import { startCase } from "lodash";
import React from "react";

import { ColorGrid } from "../color-grid";
import { ColorSample } from "../color-sample";
import styles from "./color-palette.module.css";

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

export interface ColorPaletteProps {
  color: string;
}

export const ColorPalette = ({ color }: ColorPaletteProps) => {
  const cssStyleDeclaration = getComputedStyle(document.documentElement);

  return (
    <ColorGrid title={startCase(color)}>
      {shades.map((shade) => {
        const hex = cssStyleDeclaration.getPropertyValue(
          `--pennant-color-${color}-${shade}`
        );

        return <ColorSample hex={hex} name={shade} />;
      })}
    </ColorGrid>
  );
};
