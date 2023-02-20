import "./app.stories.css";

import {
  ApolloClient,
  gql,
  HttpLink,
  InMemoryCache,
  split,
  useQuery,
} from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
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
import { createClient } from "graphql-ws";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePopper } from "react-popper";
import { useDarkMode } from "storybook-dark-mode";

import { Chart } from "../components/chart";
import { formatter } from "../helpers";
import { ChartType, Interval, Overlay, Study } from "../types";
import { ChartElement } from "../types";
import { ChartControls } from "./components/chart-controls";
import { AppToaster } from "./components/toaster";
import { CryptoCompareDataSource } from "./data-source/crypto-compare-data-source";
import { VegaDataSource } from "./data-source/vega-protocol-data-source";

export default {
  title: "Overview/Application Examples",
} as Meta;

const VEGA_URL = "api.n11.testnet.vega.xyz/graphql";

const httpLink = new HttpLink({
  uri: `https://${VEGA_URL}`,
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: `wss://${VEGA_URL}`,
  })
);

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

const MarketSelect = Select.ofType<MarketFieldsFragment>();

const renderMarket: ItemRenderer<MarketFieldsFragment> = (
  market,
  { handleClick, modifiers }
) => {
  if (!modifiers.matchesPredicate) {
    return null;
  }
  return (
    <MenuItem
      active={modifiers.active}
      disabled={market.state !== MarketState.STATE_ACTIVE}
      key={market.id}
      label={market.tradableInstrument.instrument.code}
      onClick={handleClick}
      text={market.tradableInstrument.instrument.name}
    />
  );
};

const MarketFieldsFragmentDoc = gql`
  fragment MarketFields on Market {
    id
    decimalPlaces
    positionDecimalPlaces
    state
    tradingMode
    fees {
      factors {
        makerFee
        infrastructureFee
        liquidityFee
      }
    }
    tradableInstrument {
      instrument {
        id
        name
        code
        metadata {
          tags
        }
        product {
          ... on Future {
            settlementAsset {
              id
              symbol
              name
              decimals
            }
            quoteName
            dataSourceSpecForTradingTermination {
              id
            }
          }
        }
      }
    }
    marketTimestamps {
      open
      close
    }
  }
`;

const MarketsDocument = gql`
  query Markets {
    marketsConnection {
      edges {
        node {
          ...MarketFields
        }
      }
    }
  }
  ${MarketFieldsFragmentDoc}
`;

/** The current state of a market */
export enum MarketState {
  /** Enactment date reached and usual auction exit checks pass */
  STATE_ACTIVE = "STATE_ACTIVE",
  /**
   * Market triggers cancellation condition or governance
   * votes to close before market becomes Active
   */
  STATE_CANCELLED = "STATE_CANCELLED",
  /** Governance vote (to close) */
  STATE_CLOSED = "STATE_CLOSED",
  /** Governance vote passes/wins */
  STATE_PENDING = "STATE_PENDING",
  /** The governance proposal valid and accepted */
  STATE_PROPOSED = "STATE_PROPOSED",
  /** Outcome of governance votes is to reject the market */
  STATE_REJECTED = "STATE_REJECTED",
  /** Settlement triggered and completed as defined by product */
  STATE_SETTLED = "STATE_SETTLED",
  /** Price monitoring or liquidity monitoring trigger */
  STATE_SUSPENDED = "STATE_SUSPENDED",
  /**
   * Defined by the product (i.e. from a product parameter,
   * specified in market definition, giving close date/time)
   */
  STATE_TRADING_TERMINATED = "STATE_TRADING_TERMINATED",
}

/** What market trading mode is the market in */
export enum MarketTradingMode {
  /** Auction as normal trading mode for the market, where orders are uncrossed periodically */
  TRADING_MODE_BATCH_AUCTION = "TRADING_MODE_BATCH_AUCTION",
  /** Continuous trading where orders are processed and potentially matched on arrival */
  TRADING_MODE_CONTINUOUS = "TRADING_MODE_CONTINUOUS",
  /** Auction triggered by price/liquidity monitoring */
  TRADING_MODE_MONITORING_AUCTION = "TRADING_MODE_MONITORING_AUCTION",
  /** No trading allowed */
  TRADING_MODE_NO_TRADING = "TRADING_MODE_NO_TRADING",
  /** Auction trading where orders are uncrossed at the end of the opening auction period */
  TRADING_MODE_OPENING_AUCTION = "TRADING_MODE_OPENING_AUCTION",
}

export type MarketFieldsFragment = {
  __typename?: "Market";
  id: string;
  decimalPlaces: number;
  positionDecimalPlaces: number;
  state: MarketState;
  tradingMode: MarketTradingMode;
  fees: {
    __typename?: "Fees";
    factors: {
      __typename?: "FeeFactors";
      makerFee: string;
      infrastructureFee: string;
      liquidityFee: string;
    };
  };
  tradableInstrument: {
    __typename?: "TradableInstrument";
    instrument: {
      __typename?: "Instrument";
      id: string;
      name: string;
      code: string;
      metadata: {
        __typename?: "InstrumentMetadata";
        tags?: Array<string> | null;
      };
      product: {
        __typename?: "Future";
        quoteName: string;
        settlementAsset: {
          __typename?: "Asset";
          id: string;
          symbol: string;
          name: string;
          decimals: number;
        };
        dataSourceSpecForTradingTermination: {
          __typename?: "DataSourceSpec";
          id: string;
        };
      };
    };
  };
  marketTimestamps: { __typename?: "MarketTimestamps"; open: any; close: any };
};

export type MarketsQueryVariables = { [key: string]: never };

export type MarketsQuery = {
  __typename?: "Query";
  marketsConnection?: {
    __typename?: "MarketConnection";
    edges: Array<{
      __typename?: "MarketEdge";
      node: {
        __typename?: "Market";
        id: string;
        decimalPlaces: number;
        positionDecimalPlaces: number;
        state: MarketState;
        tradingMode: MarketTradingMode;
        fees: {
          __typename?: "Fees";
          factors: {
            __typename?: "FeeFactors";
            makerFee: string;
            infrastructureFee: string;
            liquidityFee: string;
          };
        };
        tradableInstrument: {
          __typename?: "TradableInstrument";
          instrument: {
            __typename?: "Instrument";
            id: string;
            name: string;
            code: string;
            metadata: {
              __typename?: "InstrumentMetadata";
              tags?: Array<string> | null;
            };
            product: {
              __typename?: "Future";
              quoteName: string;
              settlementAsset: {
                __typename?: "Asset";
                id: string;
                symbol: string;
                name: string;
                decimals: number;
              };
              dataSourceSpecForTradingTermination: {
                __typename?: "DataSourceSpec";
                id: string;
              };
            };
          };
        };
        marketTimestamps: {
          __typename?: "MarketTimestamps";
          open: any;
          close: any;
        };
      };
    }>;
  } | null;
};

export const VegaProtocol: Story = () => {
  const ref = useRef<ChartElement>(null!);
  const [market, setMarket] = useState("");
  const [chartType, setChartType] = useState<ChartType>("candle");
  const [studies, setStudies] = useState<Study[]>(["volume"]);
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [interval, setInterval] = useState<Interval>(Interval.I15M);

  const { loading, error, data } = useQuery<
    MarketsQuery,
    MarketsQueryVariables
  >(MarketsDocument, {
    fetchPolicy: "no-cache",
  });

  const dataSource = useMemo(
    () =>
      new VegaDataSource(
        client,
        market,
        "0a0ed5f704cf29041bfa320b1015b0b0c0eedb101954ecd687e513d8472a3ff6"
      ),
    [market]
  );

  const darkmode = useDarkMode();

  const marketId =
    data?.marketsConnection?.edges.find(
      (edge) => edge.node.state === MarketState.STATE_ACTIVE
    )?.node.id ?? data?.marketsConnection?.edges[0]?.node.id;

  useEffect(() => {
    if (marketId) {
      setMarket(marketId);
    }
  }, [marketId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>`Error! ${error.message}`</p>;

  return (
    <div className="container">
      <h1>Vega Protocol Charts</h1>
      <div className="content-wrapper">
        <MarketSelect
          items={data?.marketsConnection?.edges.map((edge) => edge.node) ?? []}
          itemRenderer={renderMarket}
          onItemSelect={(item: MarketFieldsFragment) => {
            setMarket(item.id);
          }}
          noResults={<MenuItem disabled={true} text="No results." />}
          filterable={false}
        >
          <Button
            text={
              data?.marketsConnection?.edges.find(
                (s: any) => s.node.id === market
              )?.node.tradableInstrument.instrument.name ?? "No market selected"
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
          theme={darkmode ? "dark" : "light"}
          onOptionsChanged={(options) => {
            setOverlays(options.overlays ?? []);
            setStudies(options.studies ?? []);
          }}
        />
      </div>
    </div>
  );
};

VegaProtocol.parameters = {
  controls: { hideNoControlsWarning: true },
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
        className="container"
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

CryptoCompare.parameters = {
  controls: { hideNoControlsWarning: true },
};
