import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

import { useThrottledResizeObserver } from "../../hooks";
import { Application } from "./application";
import styles from "./depth-chart.module.css";

/**
 * Creates a price formatter
 * @param decimalPlaces Number of decimal places to display
 */
export const priceFormatter = (decimalPlaces: number): Intl.NumberFormat =>
  new Intl.NumberFormat("en-gb", {
    maximumFractionDigits: decimalPlaces,
    minimumFractionDigits: decimalPlaces,
  });

function defaultPriceFormat(price: number) {
  return priceFormatter(2).format(price);
}

/**
 * Standard font size in CSS pixels
 */
export const FONT_SIZE = 12;

/**
 * Height of the bottom price axis
 */
export const AXIS_HEIGHT = FONT_SIZE + 5;

export const FILL_BUY = 0x070c07;
export const FILL_BUY_LIGHT = 0x121f11;
export const STROKE_BUY = 0x243e22;
export const STROKE_BUY_LIGHT = 0x5a9c55;

export const FILL_SELL = 0x110508;
export const FILL_SELL_LIGHT = 0x2b0d13;
export const STROKE_SELL = 0x571924;
export const STROKE_SELL_LIGHT = 0xda3f5b;

export const GRAY = 0x303030;

export type PriceLevel = {
  price: number;
  volume: number;
};

export type DepthChartProps = {
  data: { buy: PriceLevel[]; sell: PriceLevel[] };
  priceFormat?: (price: number) => string;
  /** Whether the market is in auction. This is a distinct mode with its own behaviors. */
  isAuction?: boolean;
};

export interface DepthChartHandle {
  /**
   * Simulate the user hovering over the chart at a particular price
   */
  update(price: number): void;

  /**
   * Simulate the user's mouse leaving the chart
   */
  clear(): void;
}

export const DepthChart = forwardRef(
  (
    {
      data,
      priceFormat = defaultPriceFormat,
      isAuction = false,
    }: DepthChartProps,
    ref: React.Ref<DepthChartHandle>
  ) => {
    const chartRef = useRef<HTMLCanvasElement>(null!);
    const axisRef = useRef<HTMLCanvasElement>(null!);

    const application = useRef<Application>(null!);

    const {
      ref: resizeOberverRef,
      width = 300,
      height = 300,
      devicePixelContentBoxSizeInlineSize = window.devicePixelRatio * 300,
      devicePixelContentBoxSizeBlockSize = window.devicePixelRatio * 300,
    } = useThrottledResizeObserver<HTMLDivElement>(50);

    /**
     * Create a new instance of the depth chart
     */
    useEffect(() => {
      application.current = new Application({
        chartView: chartRef.current,
        axisView: axisRef.current,
        resolution: window.devicePixelRatio,
        width: 300,
        height: 300,
        priceFormat,
      });

      return () => {
        application.current.destroy();
      };
    }, [priceFormat]);

    // Update chart when dimensions or data change
    useEffect(() => {
      application.current.resize(
        devicePixelContentBoxSizeInlineSize / window.devicePixelRatio,
        devicePixelContentBoxSizeBlockSize / window.devicePixelRatio
      );
      application.current.data = data;
      application.current.render();
    }, [
      height,
      width,
      data,
      devicePixelContentBoxSizeInlineSize,
      devicePixelContentBoxSizeBlockSize,
    ]);

    useImperativeHandle(ref, () => ({
      update(price: number) {
        application.current.updatePrice(price);
      },
      clear() {
        application.current.clearPrice();
      },
    }));

    return (
      <div ref={resizeOberverRef} className={styles.canvasContainer}>
        <canvas ref={chartRef} className={styles.canvas} />
        <canvas ref={axisRef} className={styles.canvas} />
      </div>
    );
  }
);

DepthChart.displayName = "DepthChart";
