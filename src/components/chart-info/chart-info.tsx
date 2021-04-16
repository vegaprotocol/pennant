import "./chart-info.scss";

import { format } from "date-fns";

export type ChartInfoProps = {
  bounds: [Date, Date];
};

export const ChartInfo = ({ bounds }: ChartInfoProps) => {
  return (
    <div className="chart-info-wrapper">
      <div>
        <span>{`${format(bounds[0], "HH:mm dd MMM yyyy")}`}</span>
        <span className="text-muted"> to </span>
        <span>{`${format(bounds[1], "HH:mm dd MMM yyyy")}`}</span>
      </div>
    </div>
  );
};
