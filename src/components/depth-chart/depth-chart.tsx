import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

import { useThrottledResizeObserver } from "../../hooks";
import { Application } from "./application";
import styles from "./depth-chart.module.css";

// TODO: Do not recreate scenegraph whenever dimensions change
// TODO: Check parent is being set on display objects (seems to always be null)
export const AXIS_HEIGHT = 20;

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
};

export interface DepthChartHandle {
  update(price: number): void;
  clear(): void;
}

export const DepthChart = forwardRef(
  ({ data }: DepthChartProps, ref: React.Ref<DepthChartHandle>) => {
    const chartRef = useRef<HTMLCanvasElement>(null!);
    const axisRef = useRef<HTMLCanvasElement>(null!);

    const application = useRef<Application>(null!);

    const {
      ref: resizeOberverRef,
      width = 300,
      height = 300,
    } = useThrottledResizeObserver<HTMLDivElement>(50);

    useEffect(() => {
      application.current = new Application({
        chartView: chartRef.current,
        axisView: axisRef.current,
        resolution: window.devicePixelRatio,
        width: 300,
        height: 300,
      });
      /*.on("zoomstart", () => console.log("zoomstart"))
        .on("zoom", () => console.log("zoom"))
        .on("zoomend", () => console.log("zoomend")); */

      return () => {
        application.current.destroy();
      };
    }, []);

    // Update chart when dimensions or data change
    useEffect(() => {
      console.log(width, height);
      application.current.resize(width, height);
      application.current.data = data;
      application.current.render();
    }, [height, width, data]);

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
        <canvas
          ref={chartRef}
          className={styles.canvas}
          style={{
            backgroundColor: "#0f0f0f",
          }}
        />
        <canvas ref={axisRef} className={styles.canvas} />
      </div>
    );
  }
);

DepthChart.displayName = "DepthChart";
