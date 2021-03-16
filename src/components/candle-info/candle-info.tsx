import "./candle-info.scss";

import { CandleDetailsExtended } from "../../types";
import { format } from "date-fns";

export type CandleInfoProps = {
  candle: CandleDetailsExtended;
  decimalPlaces: number;
};

export const CandleInfo = ({ candle, decimalPlaces }: CandleInfoProps) => {
  return (
    <div className="candle-info-wrapper">
      <div>
        <span className="text-muted">Candle: </span>
        <span className="monospace-text">
          {candle?.date && format(candle?.date, "HH:mm dd MMM yyyy")}
        </span>
      </div>
      <div>
        <span className="text-muted">O </span>
        <span className="monospace-text">
          {candle?.open.toFixed(decimalPlaces)}
        </span>
      </div>
      <div>
        <span className="text-muted">H </span>
        <span className="monospace-text">
          {candle?.high.toFixed(decimalPlaces)}
        </span>
      </div>
      <div>
        <span className="text-muted">L </span>
        <span className="monospace-text">
          {candle?.low.toFixed(decimalPlaces)}
        </span>
      </div>
      <div>
        <span className="text-muted">C </span>
        <span className="monospace-text">
          {candle?.close.toFixed(decimalPlaces)}
        </span>
      </div>
    </div>
  );
};
