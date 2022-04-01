import "./indicator-info.css";

import classNames from "classnames";
import React from "react";

export type IndicatorInfoProps = {
  title?: string;
  info: {
    id: string;
    label?: string;
    value: string;
    intent?: "success" | "danger";
  }[];
};

export const IndicatorInfo = ({ title, info }: IndicatorInfoProps) => {
  return (
    <div className="indicator-info-wrapper">
      {title && <span className="text-muted">{`${title}: `}</span>}
      {info.map((d) => (
        <div key={d.id} className="indicator-info__item">
          {d.label && <span className="text-muted">{`${d.label} `}</span>}
          <span
            className={classNames(
              "monospace-text",
              {
                success: d.intent === "success",
              },
              {
                danger: d.intent === "danger",
              }
            )}
          >
            {d.value}
          </span>
        </div>
      ))}
    </div>
  );
};
