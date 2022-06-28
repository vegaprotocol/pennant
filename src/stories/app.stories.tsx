import "./app.stories.css";

import { ApolloClient, HttpLink, InMemoryCache, split } from "@apollo/client";
import { WebSocketLink } from "@apollo/client/link/ws";
import { getMainDefinition } from "@apollo/client/utilities";
import {
  Button,
  HotkeysProvider,
  Intent,
  Menu,
  MenuDivider,
  MenuItem,
  Overlay as BPOverlay,
  useHotkeys,
} from "@blueprintjs/core";
import { ItemRenderer, Select } from "@blueprintjs/select";
import { Meta, Story } from "@storybook/react";
import classnames from "classnames";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePopper } from "react-popper";
import { useDarkMode } from "storybook-dark-mode";

import { Chart } from "../components/chart";
import { formatter } from "../helpers";
import { ChartType, Interval, Overlay, Study } from "../types";
import { ChartElement } from "../types";
import data from "./app.stories.json";
import { ChartControls } from "./components/chart-controls";
import { AppToaster } from "./components/toaster";
import { CryptoCompareDataSource } from "./data-source/crypto-compare-data-source";
import { VegaDataSource } from "./data-source/vega-protocol-data-source";

export default {
  title: "Overview/Application Examples",
} as Meta;

const httpLink = new HttpLink({
  uri: "https://lb.testnet.vega.xyz/query",
});

const wsLink = new WebSocketLink({
  uri: "wss://lb.testnet.vega.xyz/query",
  options: {
    reconnect: true,
  },
});

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink,
  httpLink
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

type Market = {
  id: string;
  tradableInstrument: { instrument: { name: string } };
};

const MarketSelect = Select.ofType<Market>();

const renderMarket: ItemRenderer<Market> = (
  market,
  { handleClick, modifiers }
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

export const VegaProtocol: Story = () => {
  const ref = useRef<ChartElement>(null!);
  const [market, setMarket] = useState(data.markets[1].id);
  const [chartType, setChartType] = useState<ChartType>("ohlc");
  const [studies, setStudies] = useState<Study[]>([]);
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [interval, setInterval] = useState<Interval>(Interval.I1M);

  const dataSource = useMemo(
    () =>
      new VegaDataSource(
        client,
        market,
        "0a0ed5f704cf29041bfa320b1015b0b0c0eedb101954ecd687e513d8472a3ff6",
        console.log
      ),
    [market]
  );

  const darkmode = useDarkMode();

  return (
    <div className={classnames("container", { ["bp3-dark"]: darkmode })}>
      <h1>Vega Protocol Charts</h1>
      <div className="content-wrapper">
        <MarketSelect
          items={data.markets}
          itemRenderer={renderMarket}
          onItemSelect={(item: Market) => {
            setMarket(item.id);
          }}
          noResults={<MenuItem disabled={true} text="No results." />}
          filterable={false}
        >
          <Button
            text={
              data.markets.find((s) => s.id === market)?.tradableInstrument
                .instrument.name ?? "No market selected"
            }
            disabled={false}
          />
        </MarketSelect>
      </div>
      <div>
        <ChartControls
          interval={interval}
          chartType={chartType}
          overlays={overlays}
          studies={studies}
          onSetInterval={setInterval}
          onSetChartType={setChartType}
          onSetOverlays={setOverlays}
          onSetStudies={setStudies}
          onSnapshot={async () => {
            const blob = await ref.current.snapshot();

            if (blob) {
              if (navigator.clipboard) {
                await navigator?.clipboard?.write?.([
                  new ClipboardItem({ "image/png": blob }),
                ]);

                AppToaster.show({
                  intent: Intent.SUCCESS,
                  message: "Copied to clipboard",
                });
              } else {
                console.log("Clipboard API not found");
              }
            }
          }}
        />
      </div>
      <div style={{ height: "60vh" }}>
        <Chart
          ref={ref}
          dataSource={dataSource}
          options={{
            chartType: chartType,
            studies: studies,
            overlays: overlays,
          }}
          interval={interval}
          onOptionsChanged={(options) => {
            setOverlays(options.overlays ?? []);
            setStudies(options.studies ?? []);
          }}
        />
      </div>
    </div>
  );
};

export const CryptoCompare: Story = () => {
  const ref = useRef<ChartElement>(null!);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [price, setPrice] = useState(0);
  const theme = useDarkMode() ? "dark" : "light";

  const virtualReference = useRef({
    getBoundingClientRect() {
      return {
        top: 10,
        left: 10,
        bottom: 20,
        right: 100,
        width: 90,
        height: 10,
      };
    },
  });

  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
    null
  );
  const { styles, attributes } = usePopper(
    virtualReference.current as any,
    popperElement,
    { placement: "bottom-start" }
  );

  const [chartType, setChartType] = useState<ChartType>("ohlc");
  const [studies, setStudies] = useState<Study[]>([]);
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [interval, setInterval] = useState<Interval>(Interval.I1M);

  const dataSource = useMemo(() => new CryptoCompareDataSource(), []);

  const hotkeys = useMemo(
    () => [
      {
        combo: "down",
        global: false,
        preventDefault: true,
        stopPropagation: true,
        label: "Zoom out",
        onKeyDown: () => ref.current.zoomOut(0.1),
      },

      {
        combo: "left",
        global: false,
        preventDefault: true,
        stopPropagation: true,
        label: "Pan left",
        onKeyDown: () => ref.current.panBy(-1),
      },
      {
        combo: "right",
        global: false,
        preventDefault: true,
        stopPropagation: true,
        group: "Input",
        label: "Pan right",
        onKeyDown: () => ref.current.panBy(1),
      },
      {
        combo: "up",
        global: false,
        preventDefault: true,
        stopPropagation: true,
        label: "Zoom in",
        onKeyDown: () => ref.current.zoomIn(0.1),
      },
    ],
    []
  );

  useEffect(() => {
    ref.current.subscribe("contextmenu", (event) => {
      virtualReference.current = {
        getBoundingClientRect() {
          return {
            top: event.position[1],
            left: event.position[0],
            bottom: event.position[1] + 1,
            right: event.position[0] + 1,
            width: 1,
            height: 1,
          };
        },
      };
      setPrice(event.price);
      setContextMenuOpen(true);
    });
  }, []);

  const { handleKeyDown, handleKeyUp } = useHotkeys(hotkeys);

  const darkmode = useDarkMode();

  return (
    <HotkeysProvider>
      <div
        tabIndex={0}
        className={classnames("container", { ["bp3-dark"]: darkmode })}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
      >
        <h1>Crypto Compare Charts</h1>
        <ChartControls
          interval={interval}
          chartType={chartType}
          overlays={overlays}
          studies={studies}
          onSetInterval={setInterval}
          onSetChartType={setChartType}
          onSetOverlays={setOverlays}
          onSetStudies={setStudies}
          onSnapshot={async () => {
            const blob = await ref.current.snapshot();

            if (blob) {
              if (navigator.clipboard) {
                try {
                  // @ts-ignore
                  await navigator.clipboard.write([
                    new ClipboardItem({ "image/png": blob }),
                  ]);

                  AppToaster.show({
                    intent: Intent.SUCCESS,
                    message: "Copied to clipboard",
                  });
                } catch (error) {
                  AppToaster.show({
                    intent: Intent.WARNING,
                    message: "Unable to copy to clipboard",
                  });
                  console.log(error);
                }
              } else {
                AppToaster.show({
                  intent: Intent.WARNING,
                  message: "Unable to copy to clipboard",
                });
                console.log("Clipboard API not found");
              }
            }
          }}
        />
        <div style={{ height: "70vh" }}>
          <Chart
            ref={ref}
            dataSource={dataSource}
            options={{
              chartType: chartType,
              studies: studies,
              overlays: overlays,
            }}
            interval={interval}
            onOptionsChanged={(options) => {
              setOverlays(options.overlays ?? []);
              setStudies(options.studies ?? []);
            }}
            theme={theme}
          />
        </div>
        <BPOverlay
          isOpen={contextMenuOpen}
          onClose={() => {
            setContextMenuOpen(false);
          }}
          hasBackdrop={true}
          usePortal={false}
          transitionDuration={-1}
        >
          <div
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
          >
            <Menu>
              <MenuItem
                icon="new-object"
                text={`Buy @ ${formatter(price, 2)}`}
                onClick={() => {
                  alert(`Buy @ ${formatter(price, 2)}`);
                  setContextMenuOpen(false);
                }}
              />
              <MenuItem
                icon="new-object"
                text={`Sell @ ${formatter(price, 2)}`}
                onClick={() => {
                  alert(`Sell @ ${formatter(price, 2)}`);
                  setContextMenuOpen(false);
                }}
              />
              <MenuItem
                icon="reset"
                text="Reset chart"
                onClick={() => {
                  ref.current.reset();
                  setContextMenuOpen(false);
                }}
              />

              <MenuDivider />
              <MenuItem
                disabled={true}
                text={`Clicked at (${
                  virtualReference.current.getBoundingClientRect().left
                }, ${virtualReference.current.getBoundingClientRect().top})`}
              />
            </Menu>
          </div>
        </BPOverlay>
        <Button
          icon="reset"
          onClick={() => ref.current.reset()}
          style={{ marginTop: "12px" }}
        >
          Reset
        </Button>
      </div>
    </HotkeysProvider>
  );
};
