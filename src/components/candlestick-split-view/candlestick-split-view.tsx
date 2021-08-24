import classNames from "classnames";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

import { Colors } from "../../helpers";
import { useThrottledResizeObserver } from "../../hooks";
import { string2hex } from "../../renderer/utils";
import styles from "./candlestick-split-view.module.css";
import { SplitView } from "./split-view";

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

export interface View {
  id: string;
}

export type CandlestickSplitViewProps = {
  views: View[];
};

export interface CandlestickSplitViewHandle {}

export const CandlestickSplitView = forwardRef(
  (
    { views }: CandlestickSplitViewProps,
    ref: React.Ref<CandlestickSplitViewHandle>
  ) => {
    const containerRef = useRef<HTMLDivElement>(null!);
    const viewRef = useRef<HTMLDivElement>(null!);
    const splitViewViewRef = useRef<Record<string, HTMLElement>>({});

    const splitViewRef = useRef<SplitView | null>(null);

    useEffect(() => {
      splitViewRef.current = new SplitView(
        containerRef.current,
        viewRef.current
      );

      if (splitViewRef.current !== null) {
        Object.entries(splitViewViewRef.current).forEach(([key, value]) => {
          splitViewRef.current!.addView(value, {
            element: value,
            minimumSize: 10,
            maximumSize: 100,
          });
        });
      }
    }, []);

    return (
      <div
        ref={containerRef}
        className={classNames(
          styles.splitView,
          styles.vertical,
          styles.separatorBorder
        )}
      >
        {/*         <div ref={sashRef} className={styles.sashContainer}>
          <div className={classNames(styles.sash, styles.horizontal)} />
        </div> */}
        <div ref={viewRef} className={styles.splitViewContainer}>
          {views.map((view) => (
            <div
              key={view.id}
              ref={(el) => {
                splitViewViewRef.current[view.id] = el;
              }}
              className={classNames(styles.splitViewView, styles.visible)}
            >
              {view.id}
            </div>
          ))}
        </div>
      </div>
    );
  }
);

CandlestickSplitView.displayName = "CandlestickSplitView";
