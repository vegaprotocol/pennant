import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

import { Colors } from "../../helpers";
import { useThrottledResizeObserver } from "../../hooks";
import { string2hex } from "../../renderer/utils";
import { Chart } from "./chart";
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

const cssStyleDeclaration = getComputedStyle(document.documentElement);

export const BUY_FILL = string2hex(
  cssStyleDeclaration.getPropertyValue("--pennant-color-buy-fill").trim() ??
    "#070c07"
);

export const BUY_STROKE = string2hex(
  cssStyleDeclaration.getPropertyValue("--pennant-color-buy-stroke").trim() ??
    "#5a9c55"
);

export const SELL_FILL = string2hex(
  cssStyleDeclaration.getPropertyValue("--pennant-color-sell-fill").trim() ??
    "#2b0d13"
);

export const SELL_STROKE = string2hex(
  cssStyleDeclaration.getPropertyValue("--pennant-color-sell-stroke").trim() ??
    "#da3f5b"
);

export const GRAY = string2hex(Colors.GRAY);

export type PriceLevel = {
  price: number;
  volume: number;
};

export type DepthChartProps = {
  data: { buy: PriceLevel[]; sell: PriceLevel[] };
  /** Used to format tick labels on price axis */
  priceFormat?: (price: number) => string;
  /** Indicative price if the auction ended now, 0 if not in auction mode */
  indicativePrice?: number;
  /** Arithmetic average of the best bid price and best offer price. */
  midPrice?: number;
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
      indicativePrice = 0,
      midPrice = 0,
    }: DepthChartProps,
    ref: React.Ref<DepthChartHandle>
  ) => {
    const contentsRef = useRef<HTMLCanvasElement>(null!);
    const uiRef = useRef<HTMLCanvasElement>(null!);
    const chartRef = useRef<Chart>(null!);

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
      chartRef.current = new Chart({
        chartView: contentsRef.current,
        axisView: uiRef.current,
        resolution: window.devicePixelRatio,
        width: 300,
        height: 300,
        priceFormat,
      });

      return () => {
        chartRef.current.destroy();
      };
    }, [priceFormat]);

    // Update chart when dimensions or data change
    useEffect(() => {
      chartRef.current.resize(
        devicePixelContentBoxSizeInlineSize / window.devicePixelRatio,
        devicePixelContentBoxSizeBlockSize / window.devicePixelRatio
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
      chartRef.current.indicativePrice = indicativePrice;
    }, [indicativePrice]);

    useEffect(() => {
      chartRef.current.midPrice = midPrice;
    }, [midPrice]);

    useImperativeHandle(ref, () => ({
      update(price: number) {
        chartRef.current.updatePrice(price);
      },
      clear() {
        chartRef.current.clearPrice();
      },
    }));

    return (
      <div ref={resizeOberverRef} className={styles.canvasContainer}>
        <canvas ref={contentsRef} className={styles.canvas} />
        <canvas ref={uiRef} className={styles.canvas} />
      </div>
    );
  }
);

DepthChart.displayName = "DepthChart";
