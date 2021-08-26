import classNames from "classnames";
import React, { forwardRef, useEffect, useRef } from "react";

import styles from "./banderole.module.css";
import { Orientation } from "./sash";
import { SplitView } from "./split-view";

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

export type BanderoleProps = {
  children: React.ReactNode;
  vertical?: boolean;
};

export const Banderole = forwardRef(
  (
    { children, vertical = true }: BanderoleProps,
    ref: React.Ref<HTMLElement>
  ) => {
    const containerRef = useRef<HTMLDivElement>(null!);
    const splitViewContainerRef = useRef<HTMLDivElement>(null!);
    const splitViewViewRef = useRef<Record<string, HTMLElement>>({});
    const viewRef = useRef<Record<string, HTMLElement>>({});

    const splitViewRef = useRef<SplitView | null>(null);

    useEffect(() => {
      splitViewRef.current = new SplitView(
        containerRef.current,
        splitViewContainerRef.current,
        {
          orientation: vertical ? Orientation.VERTICAL : Orientation.HORIZONTAL,
        }
      );

      splitViewRef.current.on("sashreset", (index: number) => {
        splitViewRef.current?.resizeView(index, 100);
      });

      splitViewRef.current.layout(200);

      if (splitViewRef.current !== null) {
        Object.entries(splitViewViewRef.current).forEach(([key, value]) => {
          splitViewRef.current!.addView(
            value,
            {
              element: document.createElement("div"),
              minimumSize: 30,
              maximumSize: 400,
              layout: (size) => {},
            },
            60
          );
        });
      }

      const that = splitViewRef.current;

      return () => {
        that.dispose();
      };
    }, [vertical]);

    return (
      <div
        ref={containerRef}
        className={classNames(
          styles.splitView,
          vertical ? styles.vertical : styles.horizontal,
          styles.separatorBorder
        )}
      >
        <div ref={splitViewContainerRef} className={styles.splitViewContainer}>
          {React.Children.map(children, (child, index) => {
            if (!React.isValidElement(child)) {
              return null;
            }

            return (
              <div
                ref={(el) => {
                  if (el) {
                    splitViewViewRef.current[index] = el;
                  }
                }}
                className={classNames(styles.splitViewView, styles.visible)}
              >
                {React.cloneElement(child, {
                  ref: (el: HTMLElement) => {
                    if (el) {
                      viewRef.current[index] = el;
                    }
                  },
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

Banderole.displayName = "Banderole";
