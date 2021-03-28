import "./chart.scss";

import * as React from "react";

import { Colors, mergeData } from "../helpers";
import { DataSource, PriceMonitoringBounds, View } from "../types";
import { FocusStyleManager, useHotkeys } from "@blueprintjs/core";
import {
  indicatorBollingerBands,
  indicatorElderRay,
  indicatorMacd,
} from "@d3fc/d3fc-technical-indicator";

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

FocusStyleManager.onlyShowFocusOnTabs();

let topLevelViewSpec: View[] = [
  {
    name: "main",
    transform: [{ indicator: "bollinger", on: "open" }],
    layer: [
      {
        encoding: {
          x: {
            field: "date",
            type: "temporal",
          },
          y: {
            type: "quantitative",
          },
        },
        layer: [
          {
            mark: {
              type: "area",
              line: {
                color: "#009cff",
              },
              color: {
                gradient: "linear",
                stops: [
                  { offset: 0, color: "#044e80" },
                  { offset: 1, color: "#000000" },
                ],
              },
            },
            encoding: {
              y: {
                field: "close",
                type: "quantitative",
              },
              color: {
                value: "#009cff",
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
  chartType?: "area" | "candle";
  study?: "eldarRay" | "volume" | "macd";
  overlay?: "bollinger" | "envelope";
  interval: Interval;
  onSetInterval: (interval: Interval) => void;
};

export const Chart = React.forwardRef(
  (
    {
      dataSource,
      chartType,
      study,
      overlay,
      interval,
      onSetInterval,
    }: ChartProps,
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

      switch (chartType) {
        case "area":
          if (topLevelViewSpec[0].layer) {
            topLevelViewSpec[0].layer[0].layer = [
              {
                mark: {
                  type: "area",
                  line: {
                    color: "#009cff",
                  },
                  color: {
                    gradient: "linear",
                    stops: [
                      { offset: 0, color: "#044e80" },
                      { offset: 1, color: "#000000" },
                    ],
                  },
                },
                encoding: {
                  y: {
                    field: "close",
                    type: "quantitative",
                  },
                  color: {
                    value: "#009cff",
                  },
                },
              },
            ];
          }
          break;
        case "candle":
          if (topLevelViewSpec[0].layer) {
            topLevelViewSpec[0].layer[0].layer = [
              {
                mark: {
                  type: "rule",
                },
                encoding: {
                  y: {
                    field: "low",
                    type: "quantitative",
                  },
                  y2: {
                    field: "high",
                    type: "quantitative",
                  },
                  color: {
                    condition: {
                      test: { field: "open", lt: "close" },
                      value: Colors.VEGA_GREEN,
                    },
                    value: Colors.VEGA_RED,
                  },
                },
              },
              {
                mark: {
                  type: "bar",
                },
                encoding: {
                  y: {
                    field: "open",
                    type: "quantitative",
                  },
                  y2: {
                    field: "close",
                    type: "quantitative",
                  },
                  fill: {
                    condition: {
                      test: { field: "open", lt: "close" },
                      value: Colors.GREEN_DARK,
                    },
                    value: Colors.VEGA_RED,
                  },
                  stroke: {
                    condition: {
                      test: { field: "open", lt: "close" },
                      value: Colors.GREEN,
                    },
                    value: Colors.VEGA_RED,
                  },
                },
              },
            ];
          }
          break;
      }

      switch (study) {
        case "eldarRay":
          topLevelViewSpec[1] = {
            name: "study",
            data: {
              values: indicatorElderRay()(data.map((d) => d)).map((d, i) => ({
                ...data[i],
                ...d,
              })),
            },
            encoding: {
              x: { field: "date", type: "temporal" },
            },
            layer: [
              {
                mark: "line",
                encoding: {
                  y: {
                    field: "bullPower",
                    type: "quantitative",
                  },
                  color: { value: Colors.VEGA_GREEN },
                },
              },
              {
                mark: "line",
                encoding: {
                  y: {
                    field: "bearPower",
                    type: "quantitative",
                  },
                  color: { value: Colors.VEGA_YELLOW },
                },
              },
            ],
          };
          break;
        case "volume":
          topLevelViewSpec[1] = {
            name: "study",
            data: { values: data },
            mark: "bar",
            encoding: {
              x: { field: "date", type: "temporal" },
              y: {
                field: "volume",
                type: "quantitative",
              },
              fill: {
                condition: {
                  test: { field: "open", lt: "close" },
                  value: Colors.GREEN_DARK,
                },
                value: Colors.RED,
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
                  },
                  color: { value: Colors.VEGA_YELLOW },
                },
              },
              {
                mark: "line",
                encoding: {
                  y: {
                    field: "signal",
                    type: "quantitative",
                  },
                  color: { value: Colors.VEGA_ORANGE },
                },
              },
            ],
          };
          break;
        default:
          topLevelViewSpec = [topLevelViewSpec[0]];
      }

      switch (overlay) {
        case "bollinger":
          topLevelViewSpec[0].data = {
            values: indicatorBollingerBands()(data.map((d) => d.open)).map(
              (d, i) => ({
                ...data[i],
                ...d,
              })
            ),
          };

          if (topLevelViewSpec[0].layer) {
            topLevelViewSpec[0].layer[1] = {
              layer: [
                {
                  mark: { type: "line" },
                  encoding: {
                    x: { field: "date", type: "temporal" },
                    y: {
                      field: "lower",
                      type: "quantitative",
                    },
                    color: { value: Colors.VEGA_GREEN },
                  },
                },
                {
                  mark: "line",
                  encoding: {
                    x: { field: "date", type: "temporal" },
                    y: {
                      field: "upper",
                      type: "quantitative",
                    },
                    color: { value: Colors.VEGA_YELLOW },
                  },
                },
              ],
            };
          }
          break;
        default:
          topLevelViewSpec = [...topLevelViewSpec];
      }

      return [...topLevelViewSpec];
    }, [chartType, data, overlay, study]);

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
        setData((data) => mergeData(newData, merge ? data : []));
      },
      [dataSource, interval]
    );

    React.useEffect(() => {
      function subscribe() {
        dataSource.subscribe(interval, (datum) => {
          setData((data) => mergeData([datum], data));
        });
      }

      const myDataSource = dataSource;

      query(
        new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString(),
        new Date().toISOString(),
        false
      );

      //subscribe();

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
    }, [dataSource]);

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
            <NonIdealState icon="timeline-line-chart" title="No data found" />
          )}
        </div>
      </HotkeysProvider>
    );
  }
);
