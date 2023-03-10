import { numberFormatter } from "@util/misc";
import { format } from "date-fns";

import { Series, TooltipProps } from "../tooltip/tooltip";
import styles from "./custom-tooltip.module.css";

function defaultPriceFormat(price: number) {
  return numberFormatter(2).format(price);
}

/**
 * Tooltip for price chart.
 */
export const CustomTooltip = ({
  value,
  series,
  annotations,
}: TooltipProps & {
  annotations?: { volume: number; marketCap: number }[];
}) => {
  return (
    <div className={styles.tooltip}>
      <div className={styles.date}>
        <div className={styles.primary}>{format(value, "dd/MM/yyyy")}</div>
        <div className={styles.sub}>{format(value, "HH:mm a")}</div>
      </div>
      {series.map((s, i) => (
        <div key={s.name}>
          <div className={styles.series}>
            <div>
              <div
                className={styles.indicator}
                style={{ backgroundColor: s.color }}
              />
              <span className={styles.name}>{s.name}</span>
            </div>
            <span className={styles.value}>{s.value}</span>
          </div>
          {annotations ? (
            <>
              <div className={styles.series}>
                <div>
                  <span className={styles.name}>Volume</span>
                </div>
                <span className={styles.value}>
                  {defaultPriceFormat(annotations?.[i].volume)}
                </span>
              </div>
              <div className={styles.series}>
                <div>
                  <span className={styles.name}>Market cap</span>
                </div>
                <span className={styles.value}>
                  {defaultPriceFormat(annotations?.[i].marketCap)}
                </span>
              </div>
            </>
          ) : null}
        </div>
      ))}
    </div>
  );
};
