import "./chart-info.scss";

import { Button, MenuItem } from "@blueprintjs/core";
import { IItemModifiers, ItemRenderer, Select } from "@blueprintjs/select";
import { INTERVALS, IntervalOption, createIntervalOptions } from "../helpers";

import { Interval } from "../api/vega-graphql";
import { format } from "date-fns";

const IntervalSelect = Select.ofType<IntervalOption>();

const renderInterval: ItemRenderer<IntervalOption> = (
  option: IntervalOption,
  {
    handleClick,
    modifiers,
  }: {
    handleClick: React.MouseEventHandler<HTMLElement>;
    modifiers: IItemModifiers;
  }
) => {
  if (!modifiers.matchesPredicate) {
    return null;
  }
  
  return (
    <MenuItem
      active={modifiers.active}
      key={option.interval}
      onClick={handleClick}
      text={option.label}
    />
  );
};

export type ChartInfoProps = {
  interval: Interval;
  bounds: [Date, Date];
  onSetInterval: (interval: Interval) => void;
};

export const ChartInfo = ({
  interval,
  bounds,
  onSetInterval,
}: ChartInfoProps) => {
  return (
    <div className="chart-info-wrapper" style={{ pointerEvents: "auto" }}>
      <IntervalSelect
        className="interval-select"
        items={createIntervalOptions([
          "I15M",
          "I1D",
          "I1H",
          "I1M",
          "I5M",
          "I6H",
        ])}
        itemRenderer={renderInterval}
        onItemSelect={(item: IntervalOption) => {
          onSetInterval(item.interval);
        }}
        noResults={<MenuItem disabled={true} text="No intervals found" />}
        filterable={false}
      >
        <Button text={INTERVALS[interval]} disabled={false} />
      </IntervalSelect>
      <div>
        <span>{`${format(bounds[0], "HH:mm dd MMM yyyy")}`}</span>
        <span className="text-muted"> to </span>
        <span>{`${format(bounds[1], "HH:mm dd MMM yyyy")}`}</span>
      </div>
    </div>
  );
};
