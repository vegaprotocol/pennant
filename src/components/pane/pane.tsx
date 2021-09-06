import classNames from "classnames";
import { forwardRef, useEffect, useRef, useState } from "react";

import { CloseButton } from "../pane-view/close-button";
import styles from "./pane.module.css";
import { PaneView } from "./pane-view";

export type PaneProps = {
  children?: React.ReactNode;
  onClose: () => void;
};

export const Pane = forwardRef<HTMLDivElement, PaneProps>(
  ({ children, onClose }, ref) => {
    const [showControls, setShowControls] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null!);

    useEffect(() => {
      const pane = new PaneView(containerRef.current, {
        resolution: 2,
        width: 300,
        height: 300,
        priceFormat: (value: number) => "Number",
      });

      () => {
        pane.dispose();
      };
    }, []);

    return (
      <div ref={ref} className={styles.paneWrapper}>
        <div
          ref={containerRef}
          className={styles.paneWrapper}
          onMouseOver={() => setShowControls(true)}
          onMouseOut={() => setShowControls(false)}
        >
          <div className={styles.childrenWrapper}>{children}</div>
          <div
            className={classNames(styles.closeButtonWrapper, {
              [styles.hover]: showControls,
            })}
            onClick={onClose}
          >
            <CloseButton size={16} />
          </div>
        </div>
      </div>
    );
  }
);
