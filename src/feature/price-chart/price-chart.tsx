import { computePosition, flip, offset, shift } from "@floating-ui/react-dom";
import { NonIdealState, Tooltip, TooltipProps } from "@ui/components";
import { useThrottledResizeObserver } from "@util/hooks";
import { defaultPriceFormat, isDate } from "@util/misc";
import { ThemeVariant } from "@util/types";
import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";

import { Chart } from "./chart";
import { getColors } from "./helpers";
import styles from "./price-chart.module.css";

/**
 * Add custom annotations to tooltip props.
 */
export type CustomTooltipProps<A> = TooltipProps & { annotations?: A[] };

export interface Data {
  /**
   * Used for tooltips.
   */
  cols: readonly [string, string];

  /**
   * Each row represents a data point.
   */
  rows: ReadonlyArray<[Date, number]>;
}

export type PriceChartProps<A> = {
  /**
   * A data series.
   */
  data: Data;

  /**
   * An array the same length as `data["rows"]` where each element is an array of length equal to the number of series.
   * Currently only used by custom tooltips which expect annotations of type `A`.
   */
  annotations?: A[][];

  /**
   * Whether to allow the user to pan and zoom.
   */
  interactive?: boolean;

  /**
   * Override the default text to display when there is not enough data.
   */
  notEnoughDataText?: React.ReactNode;

  /**
   * Used to format values on price axis.
   */
  priceFormat?: (price: number) => string;

  /**
   * Light or dark theme.
   */
  theme?: ThemeVariant;

  /**
   * Override the default tooltip.
   */
  tooltip?: (props: CustomTooltipProps<A>) => JSX.Element;
};

/**
 * Draw a historical price chart.
 */
export const PriceChart = <A,>({
  data,
  annotations,
  interactive = true,
  notEnoughDataText = "Not enough data",
  priceFormat = defaultPriceFormat,
  theme = "dark",
  tooltip,
}: PriceChartProps<A>) => {
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
  const [tooltipContent, setTooltipContent] =
    useState<CustomTooltipProps<A> | null>(null);

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
      priceFormat,
      colors,
    });

    chartRef.current
      .on("mousemove", (d) => {
        const point = d.point;

        const rect = styleRef.current.getBoundingClientRect();

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

          setTooltipContent({
            value: d.value,
            label: {
              primary: isDate(d.value)
                ? format(d.value, "dd/MM/yyyy")
                : data.cols[0],
              sub: isDate(d.value)
                ? format(d.value, "HH:mm a")
                : String(d.value),
            },
            series: d.series,
            annotations: annotations?.[d.index],
          });
        });
      })
      .on("mouseout", () => {
        Object.assign(tooltipRef.current.style, {
          visibility: "hidden",
        });

        setTooltipContent(null);
      });

    return () => {
      chartRef.current.destroy();
    };
  }, [annotations, data.cols, priceFormat]);

  // Update chart when dimensions or data change
  useEffect(() => {
    chartRef.current.resize(
      devicePixelContentBoxSizeInlineSize
        ? devicePixelContentBoxSizeInlineSize / window.devicePixelRatio
        : width,
      devicePixelContentBoxSizeBlockSize
        ? devicePixelContentBoxSizeBlockSize / window.devicePixelRatio
        : height,
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
      () => (chartRef.current.colors = getColors(styleRef?.current)),
    );
  }, [theme]);

  useEffect(() => {
    chartRef.current.reset();
  }, [data]);

  useEffect(() => {
    chartRef.current.interactive = interactive;
  }, [interactive]);

  // There's nothing to render if we don't have at least two data points.
  if (data.rows.length < 2) {
    return (
      <div ref={styleRef} className={styles.container} data-theme={theme}>
        <NonIdealState delay={0} title={notEnoughDataText} />
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
        {tooltipContent &&
          (tooltip ? tooltip(tooltipContent) : <Tooltip {...tooltipContent} />)}
      </div>
    </div>
  );
};
