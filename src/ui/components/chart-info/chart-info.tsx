import "./chart-info.css";

import { DATE_FORMAT } from "@util/constants";
import { format } from "date-fns";

export type ChartInfoProps = {
  bounds: [Date, Date];
};

export const ChartInfo = ({ bounds }: ChartInfoProps) => {
  const fromDate = isNaN(bounds[0].getTime())
    ? "-"
    : format(bounds[0], DATE_FORMAT);

  const toDate = isNaN(bounds[1].getTime())
    ? "-"
    : format(bounds[1], DATE_FORMAT);

  return (
    <div className="chart-info-wrapper">
      <div>
        <span>{fromDate}</span>
        <span className="text-muted"> to </span>
        <span>{toDate}</span>
      </div>
    </div>
  );
};
