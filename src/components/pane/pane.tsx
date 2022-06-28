import classNames from "classnames";
import { forwardRef, useState } from "react";

import { CloseButton } from "../close-button";
import styles from "./pane.module.css";

export type PaneProps = {
  children?: React.ReactNode;
  closable?: boolean;
  onClose?: () => void;
};

export const Pane = forwardRef<HTMLDivElement, PaneProps>(
  ({ children, closable = true, onClose }, ref) => {
    const [showControls, setShowControls] = useState(false);

    return (
      <div
        ref={ref}
        className={styles.paneWrapper}
        onMouseOver={() => setShowControls(true)}
        onMouseOut={() => setShowControls(false)}
      >
        <div className={styles.childrenWrapper}>{children}</div>
        {closable && (
          <div
            className={classNames(styles.closeButtonWrapper, {
              [styles.hover]: showControls,
            })}
            onClick={onClose}
          >
            <CloseButton />
          </div>
        )}
      </div>
    );
  }
);
