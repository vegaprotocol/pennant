import { computePosition, flip, offset, shift } from "@floating-ui/react-dom";
import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";

import { useThrottledResizeObserver } from "../../hooks";
import { ThemeVariant } from "../../types";
import { numberFormatter } from "../depth-chart";
import { NonIdealState } from "../non-ideal-state";
import { Chart } from "./chart";
import { getColors } from "./helpers";
import styles from "./price-chart.module.css";
import { Tooltip } from "./tooltip";

/**
 * TODO:
 *
 * 1. Sort out tooltip
 * 1. Support mobile touch events
 */

function defaultPriceFormat(price: number) {
  return numberFormatter(2).format(price);
}

export type PriceChartProps = {
  data: {
    cols: ReadonlyArray<string>;
    rows: [Date, ...number[]][];
  };
  /** Light or dark theme */
  theme?: ThemeVariant;
};

export const PriceChart = ({ data, theme = "dark" }: PriceChartProps) => {
  const contentsRef = useRef<HTMLCanvasElement>(null!);
  const uiRef = useRef<HTMLCanvasElement>(null!);
  const chartRef = useRef<Chart>(null!);
  const styleRef = useRef<HTMLDivElement>(null!);
  const tooltipRef = useRef<HTMLDivElement>(null!);

  const [date, setDate] = useState<Date>(new Date());

  const [series, setSeries] = useState<
    { color: string; name: string; value: string }[]
  >([]);

  const {
    ref: resizeOberverRef,
    width = 300,
    height = 300,
    devicePixelContentBoxSizeInlineSize,
    devicePixelContentBoxSizeBlockSize,
  } = useThrottledResizeObserver<HTMLDivElement>(50);

  /**
   * Create a new instance of the depth chart
   */
  useEffect(() => {
    const colors = getColors(styleRef?.current);

    chartRef.current = new Chart({
      chartView: contentsRef.current,
      axisView: uiRef.current,
      resolution: window.devicePixelRatio,
      width: 300,
      height: 300,
      priceFormat: defaultPriceFormat,
      volumeFormat: defaultPriceFormat,
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
              x: point[0],
              y: point[1],
              top: point[1],
              left: point[0],
              right: point[0],
              bottom: point[1],
            };
          },
        };

        computePosition(virtualEl, tooltipRef.current, {
          placement: "left",
          middleware: [offset(16), flip(), shift()],
        }).then(({ x, y }) => {
          // TODO: transform would perform better
          Object.assign(tooltipRef.current.style, {
            left: `${x + 10}px`,
            top: `${point[1] + 10}px`,
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

  if (data.rows.length === 0) {
    return (
      <div ref={styleRef} className={styles.container} data-theme={theme}>
        <NonIdealState title="No data" />
      </div>
    );
  }

  return (
    <>
      <div ref={styleRef} className={styles.container} data-theme={theme}>
        <div ref={resizeOberverRef} className={styles.canvasContainer}>
          <canvas ref={contentsRef} className={styles.canvas} />
          <canvas ref={uiRef} className={styles.canvas} />
        </div>
        <div
          ref={tooltipRef}
          style={{
            position: "absolute",
            width: "maxContent",
            top: 0,
            left: 0,
            visibility: "hidden",
          }}
        >
          <Tooltip date={date} series={series} />
        </div>
      </div>
    </>
  );
};
