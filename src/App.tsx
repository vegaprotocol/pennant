import "./App.scss";

import * as React from "react";

import { Button, MenuItem } from "@blueprintjs/core";
import { ItemRenderer, Select } from "@blueprintjs/select";

import { Chart } from "./components/chart";
import { Interval } from "./api/vega-graphql";
import { JsonDataSource } from "./data/json-data-source";
import useSWR from "swr";

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

function App() {
  const ref = React.useRef<{ reset(): void }>(null!);
  const [market, setMarket] = React.useState<any | null>(null);
  const [interval, setInterval] = React.useState(Interval.I15M);

  const { data, error } = useSWR("https://n04.d.vega.xyz/markets", (url) =>
    fetch(url).then((r) => r.json())
  );

  const dataSource = React.useMemo(() => new JsonDataSource(market, 5), [
    market,
  ]);

  if (error) {
    return <div>failed to load</div>;
  }

  if (!data) {
    return <div>loading...</div>;
  }

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
      <Chart
        ref={ref}
        dataSource={dataSource}
        interval={interval}
        onSetInterval={setInterval}
      />
    </div>
  );
}

export default App;
