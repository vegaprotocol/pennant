import "./indicator-info.css";

import classNames from "classnames";

import { CloseButton } from "../close-button";

export type IndicatorInfoProps = {
  title?: string;
  info: {
    id: string;
    label?: string;
    value: string;
    intent?: "success" | "danger";
    color?: string;
    displayWhileNoTrading?: boolean;
  }[];
  noTrading?: boolean;
  closeable?: boolean;
  onClose?: () => void;
};

export const IndicatorInfo = ({
  title,
  info,
  noTrading = true,
  closeable = false,
  onClose,
}: IndicatorInfoProps) => {
  return (
    <div className="indicator-info-wrapper">
      {title && <span className="text-muted">{`${title}: `}</span>}
      {info
        .filter((d) => !noTrading || d.displayWhileNoTrading)
        .map((d) => (
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
                },
              )}
              {...(d.color && {
                style: { color: d.color },
              })}
            >
              {d.value}
            </span>
          </div>
        ))}
      {noTrading ? <span className="text-muted">No trading</span> : null}
      {closeable && <CloseButton title="Remove" onClick={onClose} />}
    </div>
  );
};
