import { format } from "date-fns";

import styles from "./tooltip.module.css";

export type TooltipProps = {
  date: Date;
  series: { color: string; name: string; value: string }[];
};

export const Tooltip = ({ date, series }: TooltipProps) => {
  return (
    <div className={styles.tooltip}>
      <div className={styles.date}>
        <div className={styles.primary}>{format(date, "dd/MM/yyyy")}</div>
        <div className={styles.sub}>{format(date, "HH:mm a")}</div>
      </div>
      {series.map((s) => (
        <div key={s.name} className={styles.series}>
          <div
            className={styles.indicator}
            style={{ backgroundColor: s.color }}
          />
          <span className={styles.name}>{s.name}</span>
          <span className={styles.value}>{s.value}</span>
        </div>
      ))}
    </div>
  );
};
