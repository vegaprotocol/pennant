import classNames from "classnames";
import { range } from "lodash";
import React, { forwardRef, useEffect, useRef, useState } from "react";

import useResizeObserver from "../../hooks/use-resize-observer";
import styles from "./banderole.module.css";
import { Orientation } from "./sash";
import { Sizing, SplitView } from "./split-view";

export interface View {
  id: string;
}

export type BanderoleProps = {
  children: React.ReactNode;
  maxSize?: number;
  minSize?: number;
  snap?: boolean;
  vertical?: boolean;
};

export const Banderole = forwardRef(
  (
    {
      children,
      maxSize = Infinity,
      minSize = 30,
      snap = false,
      vertical = false,
    }: BanderoleProps,
    ref: React.Ref<HTMLElement>
  ) => {
    const containerRef = useRef<HTMLDivElement>(null!);
    const splitViewContainerRef = useRef<HTMLDivElement>(null!);
    const splitViewViewRef = useRef<Record<string, HTMLElement>>({});
    const viewRef = useRef<Record<string, HTMLElement>>({});

    const splitViewRef = useRef<SplitView | null>(null);

    const [numPreviousChildren, setNumPreviousChildren] = useState(0);

    useEffect(() => {
      splitViewRef.current = new SplitView(
        containerRef.current,
        splitViewContainerRef.current,
        {
          orientation: vertical ? Orientation.Vertical : Orientation.Horizontal,
        }
      );

      splitViewRef.current.on("sashreset", (index: number) => {
        splitViewRef.current?.resizeView(index, 100);
      });

      const that = splitViewRef.current;

      return () => {
        that.dispose();
      };
    }, [vertical]);

    /**
     * Add or remove views as number of children changes
     */
    useEffect(() => {
      const numChildren = React.Children.count(children);

      if (numChildren > numPreviousChildren) {
        if (splitViewRef.current !== null) {
          range(numPreviousChildren, numChildren).forEach((index) => {
            splitViewRef.current?.addView(
              splitViewViewRef.current[index],
              {
                element: document.createElement("div"),
                minimumSize: minSize,
                maximumSize: maxSize,
                snap: snap,
                layout: (size) => {},
              },
              Sizing.Distribute
            );
          });
        }
      } else if (numChildren < numPreviousChildren) {
        if (splitViewRef.current !== null) {
          range(numPreviousChildren - 1, numChildren - 1, -1).forEach(
            (index) => {
              splitViewRef.current?.removeView(index, { type: "distribute" });
            }
          );
        }
      }

      setNumPreviousChildren(numChildren);
    }, [children, maxSize, minSize, numPreviousChildren, snap]);

    useResizeObserver({
      ref: containerRef,
      onResize: ({ width, height }) => {
        if (width && height) {
          splitViewRef.current?.layout(vertical ? height : width);
        }
      },
    });

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
                ref={(el: HTMLElement | null) => {
                  if (el) {
                    splitViewViewRef.current[index] = el;
                  } else {
                    delete splitViewViewRef.current[index];
                  }
                }}
                className={classNames(styles.splitViewView)}
              >
                {React.cloneElement(child, {
                  ref: (el: HTMLElement | null) => {
                    if (el) {
                      viewRef.current[index] = el;
                    } else {
                      delete viewRef.current[index];
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
