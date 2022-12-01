import { useEffect, useRef } from "react";

import { useThrottledResizeObserver } from "../../hooks";
import { ThemeVariant } from "../../types";
import { numberFormatter } from "../depth-chart";
import { getColors } from "../depth-chart/helpers";
import { NonIdealState } from "../non-ideal-state";
import { Chart } from "./chart";
import styles from "./price-chart.module.css";

function defaultPriceFormat(price: number) {
  return numberFormatter(2).format(price);
}

function defaultVolumeFormat(volume: number) {
  return numberFormatter(0).format(volume);
}

export type PriceChartProps = {
  data: { date: Date; price: number }[];
  /** Light or dark theme */
  theme?: ThemeVariant;
};

export const PriceChart = ({ data, theme = "dark" }: PriceChartProps) => {
  const contentsRef = useRef<HTMLCanvasElement>(null!);
  const uiRef = useRef<HTMLCanvasElement>(null!);
  const chartRef = useRef<Chart>(null!);
  const styleRef = useRef<HTMLDivElement>(null!);

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

  if (data.length === 0) {
    return (
      <div ref={styleRef} className={styles.container} data-theme={theme}>
        <NonIdealState title="No data" />
      </div>
    );
  }

  return (
    <div ref={styleRef} className={styles.container} data-theme={theme}>
      <div ref={resizeOberverRef} className={styles.canvasContainer}>
        <canvas ref={contentsRef} className={styles.canvas} />
        <canvas ref={uiRef} className={styles.canvas} />
      </div>
    </div>
  );
};
