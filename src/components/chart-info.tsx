import "./chart-info.scss";

import { Button } from "@blueprintjs/core";
import { Interval } from "../data/globalTypes";
import { format } from "date-fns";

export type ChartInfoProps = {
  interval: Interval;
  bounds: [Date, Date];
};

export const ChartInfo = ({ interval, bounds }: ChartInfoProps) => {
  return (
    <div className=".chart-info-wrapper">
      <Button small text={interval} />
      <div>
        <span>{`${format(bounds[0], "HH:mm dd MMM yyyy")}`}</span>
        <span className="bp3-text-muted"> to </span>
        <span>{`${format(bounds[1], "HH:mm dd MMM yyyy")}`}</span>
      </div>
    </div>
  );
};
