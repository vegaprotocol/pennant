import "./candle-info.scss";

import { CandleDetailsExtended } from "./candlestick-chart";
import { format } from "date-fns";

export type CandleInfoProps = {
  candle: CandleDetailsExtended;
  decimalPlaces: number;
};

export const CandleInfo = ({ candle, decimalPlaces }: CandleInfoProps) => {
  return (
    <div className="candle-info-wrapper">
      <div>
        <span className="bp3-text-muted">Candle: </span>
        <span className="bp3-monospace-text">
          {candle?.date && format(candle?.date, "HH:mm dd MMM yyyy")}
        </span>
      </div>
      <div>
        <span className="bp3-text-muted">O </span>
        <span className="bp3-monospace-text">
          {candle?.open.toFixed(decimalPlaces)}
        </span>
      </div>
      <div>
        <span className="bp3-text-muted">H </span>
        <span className="bp3-monospace-text">
          {candle?.high.toFixed(decimalPlaces)}
        </span>
      </div>
      <div>
        <span className="bp3-text-muted">L </span>
        <span className="bp3-monospace-text">
          {candle?.low.toFixed(decimalPlaces)}
        </span>
      </div>
      <div>
        <span className="bp3-text-muted">C </span>
        <span className="bp3-monospace-text">
          {candle?.close.toFixed(decimalPlaces)}
        </span>
      </div>
    </div>
  );
};
