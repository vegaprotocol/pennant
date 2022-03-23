import "../../styles/variables.css";

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

import { Colors } from "../../helpers";
import { useThrottledResizeObserver } from "../../hooks";
import { string2hex } from "../../renderer/utils";
import { ThemeVariant } from "../../types";
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

export const GRAY = string2hex(Colors.GRAY);

export interface Colors {
  buyFill: number;
  buyStroke: number;
  sellFill: number;
  sellStroke: number;
  backgroundSurface: number;
  textPrimary: number;
  textSecondary: number;
}

function getColors(element: HTMLElement): Colors {
  const cssStyleDeclaration = getComputedStyle(element);

  return {
    buyFill: string2hex(
      cssStyleDeclaration.getPropertyValue("--pennant-color-buy-fill").trim() ||
        "#16452d"
    ),
    buyStroke: string2hex(
      cssStyleDeclaration
        .getPropertyValue("--pennant-color-buy-stroke")
        .trim() || "#26ff8a"
    ),
    sellFill: string2hex(
      cssStyleDeclaration
        .getPropertyValue("--pennant-color-sell-fill")
        .trim() || "#800700"
    ),
    sellStroke: string2hex(
      cssStyleDeclaration
        .getPropertyValue("--pennant-color-sell-stroke")
        .trim() || "#ff261a"
    ),
    textPrimary: string2hex(
      cssStyleDeclaration
        .getPropertyValue("--pennant-font-color-base")
        .trim() || "#ffffff"
    ),
    textSecondary: string2hex(
      cssStyleDeclaration
        .getPropertyValue("--pennant-font-color-secondary")
        .trim() || "#fafafa"
    ),
    backgroundSurface: string2hex(
      cssStyleDeclaration
        .getPropertyValue("--pennant-background-surface-color")
        .trim() || "#0a0a0a"
    ),
  };
}

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
  /** Light or dark theme */
  theme?: ThemeVariant;
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
      theme = "dark",
    }: DepthChartProps,
    ref: React.Ref<DepthChartHandle>
  ) => {
    const contentsRef = useRef<HTMLCanvasElement>(null!);
    const uiRef = useRef<HTMLCanvasElement>(null!);
    const chartRef = useRef<Chart>(null!);
    const styleRef = useRef<HTMLDivElement>(null!);

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
      const colors = getColors(styleRef?.current);

      chartRef.current = new Chart({
        chartView: contentsRef.current,
        axisView: uiRef.current,
        resolution: window.devicePixelRatio,
        width: 300,
        height: 300,
        priceFormat,
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

    useEffect(() => {
      chartRef.current.colors = getColors(styleRef?.current);
    }, [theme]);

    useImperativeHandle(ref, () => ({
      update(price: number) {
        chartRef.current.updatePrice(price);
      },
      clear() {
        chartRef.current.clearPrice();
      },
    }));

    return (
      <div ref={styleRef} className={styles.container} data-theme={theme}>
        <div ref={resizeOberverRef} className={styles.canvasContainer}>
          <canvas ref={contentsRef} className={styles.canvas} />
          <canvas ref={uiRef} className={styles.canvas} />
        </div>
      </div>
    );
  }
);

DepthChart.displayName = "DepthChart";
