import "./app.stories.scss";

import { Button, MenuItem } from "@blueprintjs/core";
import { Chart, ChartProps } from "../components/chart";
import { ItemRenderer, Select } from "@blueprintjs/select";
import { Meta, Story } from "@storybook/react/types-6-0";

import { Interval } from "../api/vega-graphql";
import { JsonDataSource } from "../data/json-data-source";
import React from "react";
import data from "./app.stories.json";

export default {
  title: "Example/Application",
  component: Chart,
} as Meta;

const MarketSelect = Select.ofType<any>();

const renderMarket: ItemRenderer<any> = (
  market: any,
  { handleClick, modifiers }: any
) => {
  if (!modifiers.matchesPredicate) {
    return null;
  }
  return (
    <MenuItem
      active={modifiers.active}
      key={market.id}
      label={market.tradableInstrument.instrument.name}
      onClick={handleClick}
      text={market.tradableInstrument.instrument.name}
    />
  );
};

export const SimpleWebpage: Story = () => {
  const ref = React.useRef<{ reset(): void }>(null!);
  const [market, setMarket] = React.useState(data.markets[0].id);
  const [interval, setInterval] = React.useState(Interval.I15M);

  const dataSource = React.useMemo(() => new JsonDataSource(market, 5), [
    market,
  ]);

  return (
    <div className="container bp3-dark">
      <h1>Console Charts</h1>
      <div className="content-wrapper">
        <MarketSelect
          items={data.markets}
          itemRenderer={renderMarket}
          onItemSelect={(item: any) => {
            setMarket(item);
          }}
          noResults={<MenuItem disabled={true} text="No results." />}
          filterable={false}
        >
          <Button
            text={
              data.markets[0].tradableInstrument.instrument.name ??
              "No market selected"
            }
            disabled={false}
          />
        </MarketSelect>
        <Button
          icon="refresh"
          intent="primary"
          text="Reset"
          onClick={() => {
            ref.current.reset();
          }}
        />
      </div>
      <div style={{ height: "60vh" }}>
        <Chart
          ref={ref}
          dataSource={dataSource}
          interval={interval}
          onSetInterval={setInterval}
        />
      </div>
    </div>
  );
};
