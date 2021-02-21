import "./App.scss";

import * as React from "react";

import { Button, MenuItem } from "@blueprintjs/core";
import { ItemRenderer, Select } from "@blueprintjs/select";

import { Chart } from "./components/chart";
import { Interval } from "./data/globalTypes";
import { JsonDataSource } from "./data/json-data-source";
import { useApolloClient } from "@apollo/client";

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
  const client = useApolloClient();
  const [markets, setMarkets] = React.useState([]);
  const [market, setMarket] = React.useState<any | null>(null);

  const dataSource = React.useMemo(
    () => new JsonDataSource(client, market?.id ?? "076BB86A5AA41E3E"),
    [client, market]
  );

  React.useEffect(() => {
    fetch("https://n04.d.vega.xyz/markets")
      .then((response) => response.json())
      .then((data) => setMarkets(data.markets));
  }, []);

  return (
    <div
      className="container bp3-dark"
      style={{ padding: "8px", height: "100%" }}
    >
      <h1>Console Charts</h1>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "8px",
          paddingBottom: "8px",
        }}
      >
        <MarketSelect
          items={markets}
          itemRenderer={renderMarket}
          onItemSelect={(item: any) => {
            setMarket(item);
          }}
          noResults={<MenuItem disabled={true} text="No results." />}
          filterable={false}
        >
          <Button
            text={
              market?.tradableInstrument.instrument.name ?? "No market selected"
            }
            disabled={false}
          />
        </MarketSelect>
        <Button icon="refresh" intent="primary" text="Reset" />
        <Button icon="random" intent="primary" text="Randomise" />
      </div>
      <Chart dataSource={dataSource} interval={Interval.I5M} />
    </div>
  );
}

export default App;
