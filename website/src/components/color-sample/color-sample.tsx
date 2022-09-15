import React from "react";

import styles from "./color-sample.module.css";

export interface ColorSampleProps {
  hex: string;
  name: string;
}

export const ColorSample = ({ hex, name }: ColorSampleProps) => {
  return (
    <div
      className={styles.sample}
      onClick={() => navigator.clipboard.writeText(hex)}
    >
      <div className={styles.color} style={{ backgroundColor: hex }}></div>
      <div className={styles.description}>
        <div>{name}</div>
        <div className={styles.hex}>{hex}</div>
      </div>
    </div>
  );
};
