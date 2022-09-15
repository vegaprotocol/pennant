import React from "react";

import styles from "./color-grid.module.css";

export interface ColorGridProps {
  children: React.ReactNode;
  title: string;
}

export const ColorGrid = ({ children, title }: ColorGridProps) => {
  return (
    <div className={styles.container}>
      <div className={styles.title}>{title}</div>
      <div className={styles.grid}>{children}</div>
    </div>
  );
};
