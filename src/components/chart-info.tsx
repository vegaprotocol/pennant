import "./chart-info.scss";

import { Button } from "@blueprintjs/core";
import { Interval } from "../api/vega-graphql";
import { format } from "date-fns";

export const INTERVALS: { [I in Interval]: string } = {
  I1M: "1m",
  I5M: "5m",
  I15M: "15m",
  I1H: "1h",
  I6H: "6h",
  I1D: "1d",
};

export type ChartInfoProps = {
  interval: Interval;
  bounds: [Date, Date];
};

export const ChartInfo = ({ interval, bounds }: ChartInfoProps) => {
  return (
    <div className="chart-info-wrapper">
      <Button small text={INTERVALS[interval]} />
      <div>
        <span>{`${format(bounds[0], "HH:mm dd MMM yyyy")}`}</span>
        <span className="text-muted"> to </span>
        <span>{`${format(bounds[1], "HH:mm dd MMM yyyy")}`}</span>
      </div>
    </div>
  );
};
