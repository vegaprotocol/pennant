import "./annotation.scss";

import * as React from "react";

import classNames from "classnames";

export type Intent = "none" | "primary" | "success" | "warning" | "danger";

export type AnnotationProps = {
  cells: {
    label: string;
    stroke?: boolean;
    fill?: boolean;
    onClick?: () => void;
  }[];
  intent: Intent;
};

export const Annotation = React.forwardRef<HTMLDivElement, AnnotationProps>(
  ({ cells, intent = "none" }, ref) => {
    return (
      <div ref={ref} className={`annotation intent-${intent}`}>
        {cells.map((cell) => (
          <div
            key={cell.label}
            className={classNames(
              "cell",
              { fill: cell.fill },
              { stroke: cell.stroke }
            )}
          >
            {cell.onClick ? (
              <button className="action" onClick={cell.onClick}>
                {cell.label}
              </button>
            ) : (
              cell.label
            )}
          </div>
        ))}
      </div>
    );
  }
);
