import styles from "./tooltip.module.css";

/**
 * Information to support rendering a tooltip.
 */
export interface Series {
  color: string;
  name: string;
  value: string;
}

export type TooltipProps = {
  value: number | Date;
  label: { primary: string; sub: string | null };
  series: Series[];
};

/**
 * Tooltip for area, line and price charts.
 */
export const Tooltip = ({ label, series }: TooltipProps) => {
  return (
    <div className={styles.tooltip}>
      <div className={styles.date}>
        {label.primary ? (
          <div className={styles.primary}>{label.primary}</div>
        ) : null}
        {label.sub ? <div className={styles.sub}>{label.sub}</div> : null}
      </div>
      {series.map((s) => (
        <div key={s.name} className={styles.series}>
          <div>
            <div
              className={styles.indicator}
              style={{ backgroundColor: s.color }}
            />
            <span className={styles.name}>{s.name}</span>
          </div>
          <span className={styles.value}>{s.value}</span>
        </div>
      ))}
    </div>
  );
};
