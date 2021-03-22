import "./chart.scss";

import * as React from "react";

import { Colors, mergeData } from "../helpers";
import { DataSource, PriceMonitoringBounds, View } from "../types";
import { FocusStyleManager, useHotkeys } from "@blueprintjs/core";

import AutoSizer from "react-virtualized-auto-sizer";
import { CandleInfo } from "./candle-info";
import { ChartInfo } from "./chart-info";
import { ChartInterface } from "../types";
import { HotkeysProvider } from "@blueprintjs/core";
import { Interval } from "../api/vega-graphql";
import { NonIdealState } from "./non-ideal-state";
import { PlotContainer } from "./plot-container";
import { PriceMonitoringInfo } from "./price-monitoring-info";
import { ResetButton } from "./reset-button";
import { indicatorMacd } from "@d3fc/d3fc-technical-indicator";

FocusStyleManager.onlyShowFocusOnTabs();

let topLevelViewSpec: View[] = [
  {
    name: "main",
    layer: [
      {
        encoding: {
          x: {
            field: "date",
            type: "temporal",
          },
          y: {
            type: "quantitative",
            scale: { zero: false },
          },
          color: {
            value: Colors.RED,
          },
        },
        layer: [
          {
            name: "wick",
            mark: "rule",
            encoding: { y: { field: "low" }, y2: { field: "high" } },
          },
          {
            name: "candle",
            mark: "bar",
            encoding: {
              y: { field: "open" },
              y2: { field: "close" },
              fill: {
                condition: {
                  test: ["lt", "open", "close"],
                  value: Colors.GREEN_DARK,
                },
                value: Colors.RED,
              },
              stroke: {
                condition: {
                  test: ["lt", "open", "close"],
                  value: Colors.GREEN,
                },
                value: Colors.RED,
              },
            },
          },
        ],
      },
    ],
  },
];

export type ChartProps = {
  dataSource: DataSource;
  study?: "volume" | "macd";
  interval: Interval;
  onSetInterval: (interval: Interval) => void;
};

export const Chart = React.forwardRef(
  (
    { dataSource, study, interval, onSetInterval }: ChartProps,
    ref: React.Ref<ChartInterface>
  ) => {
    React.useImperativeHandle(ref, () => ({
      fitBounds: (bounds: [Date, Date]) => {
        chartRef.current.fitBounds(bounds);
      },
      panBy: (n: number) => {
        chartRef.current.reset();
      },
      panTo: (x: Date) => {
        chartRef.current.reset();
      },
      reset: () => {
        chartRef.current.reset();
      },
    }));

    const chartRef = React.useRef<ChartInterface>(null!);
    const [data, setData] = React.useState<any[]>([]);
    const [
      priceMonitoringBounds,
      setPriceMonitoringBounds,
    ] = React.useState<PriceMonitoringBounds | null>(null);
    const [bounds, setBounds] = React.useState<[Date, Date]>([
      new Date(),
      new Date(),
    ]);
    const [selectedIndex, setCandle] = React.useState<number | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    const view = React.useMemo(() => {
      topLevelViewSpec[0].data = {
        values: data,
      };

      switch (study) {
        case "volume":
          topLevelViewSpec[1] = {
            name: "study",
            data: { values: data },
            mark: "area",
            encoding: {
              x: { field: "date", type: "temporal" },
              y: {
                field: "volume",
                type: "quantitative",
                scale: { zero: true },
              },
            },
          };
          break;
        case "macd":
          topLevelViewSpec[1] = {
            name: "study",
            data: {
              values: indicatorMacd()(data.map((d) => d.open)).map((d, i) => ({
                ...data[i],
                ...d,
              })),
            },
            encoding: {
              x: { field: "date", type: "temporal" },
            },
            layer: [
              {
                mark: "bar",
                encoding: {
                  y: {
                    field: "divergence",
                    type: "quantitative",
                    scale: { zero: true },
                  },
                  fill: { value: Colors.GRAY_LIGHT_1 },
                },
              },
              {
                mark: "line",
                encoding: {
                  y: {
                    field: "macd",
                    type: "quantitative",
                    scale: { zero: true },
                  },
                  color: { value: "red" },
                },
              },
              {
                mark: "line",
                encoding: {
                  y: {
                    field: "signal",
                    type: "quantitative",
                    scale: { zero: true },
                  },
                  color: { value: "green" },
                },
              },
            ],
          };
          break;
        default:
          topLevelViewSpec = [topLevelViewSpec[0]];
      }

      return topLevelViewSpec;
    }, [data, study]);

    const hotkeys = React.useMemo(
      () => [
        {
          combo: "r",
          global: true,
          label: "Reset",
          onKeyDown: () => {
            chartRef.current.reset();
          },
        },
        {
          combo: "left",
          global: true,
          label: "Refresh data",
          onKeyDown: () => {
            chartRef.current.panBy(-1);
          },
        },
        {
          combo: "right",
          global: true,
          label: "Focus text input",
          onKeyDown: () => {
            chartRef.current.panBy(1);
          },
        },
      ],
      []
    );

    const { handleKeyDown, handleKeyUp } = useHotkeys(hotkeys);

    const query = React.useCallback(
      async (from: string, to: string, merge = true) => {
        const newData = await dataSource.query(interval, from, to);

        // TODO: need convenience functions for calculating range, sorting and distinct values and merging
        setData((data) => mergeData(merge ? data : [], newData));
      },
      [dataSource, interval]
    );

    React.useEffect(() => {
      function subscribe() {
        dataSource.subscribe(interval, (datum) => {
          setData((data) => mergeData(data, [datum]));
        });
      }

      const myDataSource = dataSource;

      query(
        new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString(),
        new Date().toISOString(),
        false
      );

      subscribe();

      return () => {
        myDataSource.unsubscribe();
      };
    }, [dataSource, interval, query]);

    React.useEffect(() => {
      setIsLoading(true);

      dataSource.onReady().then((configuration) => {
        console.info(`Data Source ready:`, configuration);
        setIsLoading(false);

        if (
          configuration.priceMonitoringBounds.length > 0 &&
          topLevelViewSpec[0].layer
        ) {
          setPriceMonitoringBounds(configuration.priceMonitoringBounds[0]);

          topLevelViewSpec[0].layer[1] = {
            data: {
              values: [
                {
                  max: configuration.priceMonitoringBounds[0].maxValidPrice,
                  min: configuration.priceMonitoringBounds[0].minValidPrice,
                  reference:
                    configuration.priceMonitoringBounds[0].referencePrice,
                },
              ],
            },
            layer: [
              {
                encoding: {
                  y: { field: "max" },
                  color: { value: Colors.WHITE },
                },
                mark: "rule",
              },
              {
                encoding: {
                  y: { field: "min" },
                  color: { value: Colors.WHITE },
                },
                mark: "rule",
              },
            ],
          };
        }
      });
    }, [dataSource, study]);

    const handleGetDataRange = React.useCallback(
      (from: string, to: string) => {
        query(from, to);
      },
      [query]
    );

    const handleOnMouseOut = React.useCallback(() => setCandle(null), []);

    if (isLoading) {
      return <NonIdealState icon="timeline-line-chart" title="Loading" />;
    }

    return (
      <HotkeysProvider>
        <div
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          style={{ height: "100%" }}
        >
          {!isLoading && data.length > 1 ? (
            <div className="chart-wrapper">
              <AutoSizer
                defaultHeight={150}
                defaultWidth={300}
                style={{ height: "100%", width: "100%" }} // TODO: Find a better method
              >
                {({ height, width }) => (
                  <PlotContainer
                    ref={chartRef}
                    width={width}
                    height={height}
                    data={data}
                    view={view}
                    interval={interval}
                    decimalPlaces={dataSource.decimalPlaces}
                    onBoundsChanged={setBounds}
                    onMouseMove={setCandle}
                    onMouseOut={handleOnMouseOut}
                    onGetDataRange={handleGetDataRange}
                  />
                )}
              </AutoSizer>
              <div className="overlay">
                <ChartInfo
                  interval={interval}
                  bounds={bounds}
                  onSetInterval={onSetInterval}
                />
                {priceMonitoringBounds && (
                  <PriceMonitoringInfo
                    priceMonitoringBounds={priceMonitoringBounds}
                    decimalPlaces={dataSource.decimalPlaces}
                  />
                )}
                {selectedIndex !== null && (
                  <CandleInfo
                    candle={data[selectedIndex]}
                    decimalPlaces={dataSource.decimalPlaces}
                  />
                )}
                <ResetButton
                  onClick={() => {
                    chartRef.current.reset();
                  }}
                />
              </div>
            </div>
          ) : (
            <NonIdealState
              icon="timeline-line-chart"
              title="No data found"
              description="Try a different market"
            />
          )}
        </div>
      </HotkeysProvider>
    );
  }
);
