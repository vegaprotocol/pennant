import { computePosition, flip, offset, shift } from "@floating-ui/react-dom";
import { useEffect, useRef, useState } from "react";

import { useThrottledResizeObserver } from "../../hooks";
import { ThemeVariant } from "../../types";
import { numberFormatter } from "../depth-chart";
import { NonIdealState } from "../non-ideal-state";
import { Chart } from "./chart";
import { Series, Tooltip } from "./components";
import { getColors } from "./helpers";
import styles from "./price-chart.module.css";

function defaultPriceFormat(price: number) {
  return numberFormatter(2).format(price);
}

/**
 * A set of data points with the same x-axis location.
 */
export type Row = [Date, ...number[]];

export interface Data {
  /**
   * Used for tooltips.
   */
  cols: ReadonlyArray<string>;

  /**
   * Each row represents a set of data points with the same x-axis location.
   */
  rows: Row[];
}

export type PriceChartProps = {
  /**
   * One or more data series.
   */
  data: Data;

  /**
   * Light or dark theme.
   */
  theme?: ThemeVariant;
};

/**
 * Draw a historical price chart. Supports multiple line series.
 */
export const PriceChart = ({ data, theme = "dark" }: PriceChartProps) => {
  /**
   * Where to render chart contents, e.g. line series.
   */
  const contentsRef = useRef<HTMLCanvasElement>(null!);

  /**
   * Where to render chart ui, e.g. crosshairs.
   */
  const uiRef = useRef<HTMLCanvasElement>(null!);

  /**
   * Reference to chart instance.
   */
  const chartRef = useRef<Chart>(null!);

  /**
   * Reference to element from which we can extract CSS styles.
   */
  const styleRef = useRef<HTMLDivElement>(null!);

  /**
   * Where to render tooltip.
   */
  const tooltipRef = useRef<HTMLDivElement>(null!);

  // Tooltip state
  // TODO: Combine into single state
  const [date, setDate] = useState<Date>(new Date());
  const [series, setSeries] = useState<Series[]>([]);

  const {
    ref: resizeOberverRef,
    width = 300,
    height = 300,
    devicePixelContentBoxSizeInlineSize,
    devicePixelContentBoxSizeBlockSize,
  } = useThrottledResizeObserver<HTMLDivElement>(50);

  // Create a new instance of the price chart
  useEffect(() => {
    const colors = getColors(styleRef?.current);

    chartRef.current = new Chart({
      chartView: contentsRef.current,
      axisView: uiRef.current,
      resolution: window.devicePixelRatio,
      width: 300,
      height: 300,
      colors,
    });

    chartRef.current
      .on("mousemove", (d) => {
        const point = d.point;

        const virtualEl = {
          getBoundingClientRect() {
            return {
              width: 0,
              height: 0,
              x: point[0] + rect.x,
              y: point[1] + rect.y,
              top: point[1] + rect.y,
              left: point[0] + rect.x,
              right: point[0] + rect.x,
              bottom: point[1] + rect.y,
            };
          },
        };

        const rect = styleRef.current.getBoundingClientRect();

        computePosition(virtualEl, tooltipRef.current, {
          placement: "right",
          middleware: [offset(16), flip(), shift()],
        }).then(({ x, y }) => {
          // TODO: Check window.devicePixelRatio to round by DPR
          Object.assign(tooltipRef.current.style, {
            left: 0,
            top: 0,
            transform: `translate(${Math.round(x)}px,${Math.round(y)}px)`,
            visibility: "visible",
          });

          setDate(d.date);
          setSeries(d.series);
        });
      })
      .on("mouseout", () => {
        Object.assign(tooltipRef.current.style, {
          visibility: "hidden",
        });
      });

    return () => {
      chartRef.current.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update chart when dimensions or data change
  useEffect(() => {
    chartRef.current.resize(
      devicePixelContentBoxSizeInlineSize
        ? devicePixelContentBoxSizeInlineSize / window.devicePixelRatio
        : width,
      devicePixelContentBoxSizeBlockSize
        ? devicePixelContentBoxSizeBlockSize / window.devicePixelRatio
        : height
    );

    chartRef.current.data = data;
    chartRef.current.render();
  }, [
    height,
    width,
    data,
    devicePixelContentBoxSizeInlineSize,
    devicePixelContentBoxSizeBlockSize,
  ]);

  useEffect(() => {
    requestAnimationFrame(
      () => (chartRef.current.colors = getColors(styleRef?.current))
    );
  }, [theme]);

  useEffect(() => {
    chartRef.current.reset();
  }, [data]);

  // There's nothing to render if we don't have at least two data points.
  if (data.rows.length < 2) {
    return (
      <div ref={styleRef} className={styles.container} data-theme={theme}>
        <NonIdealState delay={0} title="Not enough data" />
      </div>
    );
  }

  return (
    <div ref={styleRef} className={styles.container} data-theme={theme}>
      <div ref={resizeOberverRef} className={styles.canvasContainer}>
        <canvas ref={contentsRef} className={styles.canvas} />
        <canvas ref={uiRef} className={styles.canvas} />
      </div>
      <div ref={tooltipRef} className={styles.tooltipContainer}>
        <Tooltip date={date} series={series} />
      </div>
    </div>
  );
};
