import "banderole/dist/style.css";

import { Banderole } from "banderole";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import { Colors } from "../../helpers";
import { useThrottledResizeObserver } from "../../hooks";
import { string2hex } from "../../renderer/utils";
import { Pane } from "../pane";
import { CloseButton } from "../pane-view/close-button";
import styles from "./candlestick-chart.module.css";
import { Chart } from "./chart";

const AXIS_WIDTH = 20;

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

export type CandlestickChartProps = {};

export interface CandlestickChartHandle {}

export const CandlestickChart = forwardRef(
  ({}: CandlestickChartProps, ref: React.Ref<CandlestickChartHandle>) => {
    const contentsRef = useRef<HTMLCanvasElement>(null!);
    const uiRef = useRef<HTMLCanvasElement>(null!);

    const chartRef = useRef<Chart>(null!);

    const [panes, setPanes] = useState([0, 1]);

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
      chartRef.current = new Chart({
        chartView: contentsRef.current,
        axisView: uiRef.current,
        resolution: window.devicePixelRatio,
        width: 300,
        height: 300,
        priceFormat: defaultPriceFormat,
      });

      return () => {
        chartRef.current.destroy();
      };
    }, []);

    // Update chart when dimensions or data change
    useEffect(() => {
      const devicePixelRatio = window.devicePixelRatio;

      chartRef.current.resize(
        (devicePixelContentBoxSizeInlineSize ?? width * devicePixelRatio) /
          window.devicePixelRatio,
        (devicePixelContentBoxSizeBlockSize ?? height * devicePixelRatio) /
          window.devicePixelRatio
      );

      chartRef.current.render();
    }, [
      height,
      width,
      devicePixelContentBoxSizeInlineSize,
      devicePixelContentBoxSizeBlockSize,
    ]);

    return (
      <Banderole vertical>
        <div style={{ backgroundColor: "black", height: "100%" }}>
          <div ref={resizeOberverRef} className={styles.canvasContainer}>
            <canvas ref={contentsRef} className={styles.canvas} />
            <canvas ref={uiRef} className={styles.canvas} />
          </div>
        </div>
        {panes.map((pane, index) => (
          <Pane
            key={pane}
            onClose={() => {
              setPanes((panes) => {
                const newPanes = [...panes];
                newPanes.splice(index, 1);

                return newPanes;
              });
            }}
          >
            <div style={{ color: "white" }}>Important information</div>
          </Pane>
        ))}
      </Banderole>
    );
  }
);

CandlestickChart.displayName = "CandlestickChart";
