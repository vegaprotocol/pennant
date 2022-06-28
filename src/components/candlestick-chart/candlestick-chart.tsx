import "allotment/dist/style.css";

import { Allotment } from "allotment";
import { throttle } from "lodash";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  INITIAL_NUM_CANDLES_TO_DISPLAY,
  INITIAL_NUM_CANDLES_TO_FETCH,
  THROTTLE_INTERVAL,
} from "../../constants";
import {
  constructTopLevelSpecV2,
  formatter,
  getCandleWidth,
  getSubMinutes,
  mergeData,
} from "../../helpers";
import { parse } from "../../scenegraph/parse";
import {
  Bounds,
  Candle,
  ChartType,
  DataSource,
  Interval,
  Overlay,
  Study,
} from "../../types";
import { useOnReady } from "../chart/hooks";
import { IndicatorInfo } from "../indicator-info";
import { NonIdealState } from "../non-ideal-state";
import { Pane as PaneView } from "../pane";
import {
  getIntent,
  getStudyInfoFieldValue,
  studyInfoFields,
} from "../pane-view/helpers";
import styles from "./candlestick-chart.module.css";
import { Chart } from "./chart";
import { Colors, getColors } from "./helpers";
import { Pane } from "./pane";

const noop = () => {};

export interface StudyOptions {
  id: string;
  study: Study;
}
export interface Options {
  chartType?: ChartType;
  initialNumCandlesToDisplay?: number;
  initialNumCandlesToFetch?: number;
  overlays?: Overlay[];
  studies: Study[];
  simple?: boolean;
}

export type CandlestickChartProps = {
  dataSource: DataSource;
  interval: Interval;
  options?: Options;
  onOptionsChanged?: (options: Options) => void;
};

export interface CandlestickChartHandle {}

export const CandlestickChart = forwardRef(
  (
    {
      dataSource,
      interval,
      options = {
        chartType: ChartType.CANDLE,
        studies: [],
        overlays: [],
        initialNumCandlesToDisplay: INITIAL_NUM_CANDLES_TO_DISPLAY,
        initialNumCandlesToFetch: INITIAL_NUM_CANDLES_TO_FETCH,
      },
      onOptionsChanged = noop,
    }: CandlestickChartProps,
    ref: React.Ref<CandlestickChartHandle>
  ) => {
    const chartRef = useRef<Chart>(null!);
    const containerRef = useRef<HTMLDivElement>(null!);
    const paneRef = useRef<Record<string, HTMLElement>>({});
    const axisRef = useRef<HTMLElement | null>(null);
    const previousIds = useRef<string[]>([]);

    // State
    const [bounds, setBounds] = useState<Bounds | null>(null);
    const [data, setData] = useState<Candle[]>([]);
    const [dataIndex, setDataIndex] = useState<number | null>(null);
    const [internalInterval, setInternalInterval] = useState(interval);
    const [colors, setColors] = useState<Colors>(getColors(null));
    const [loading, setLoading] = useState(true);

    const handleBoundsChanged = useMemo(
      () => throttle(setBounds, THROTTLE_INTERVAL),
      []
    );

    const handleDataIndexChanged = useMemo(
      () => throttle(setDataIndex, THROTTLE_INTERVAL),
      []
    );

    const {
      chartType = ChartType.CANDLE,
      studies = [],
      overlays = [],
      simple = false,
      initialNumCandlesToDisplay:
        initialNumCandles = INITIAL_NUM_CANDLES_TO_DISPLAY,
      initialNumCandlesToFetch:
        initialNumCandlesToFetch = INITIAL_NUM_CANDLES_TO_FETCH,
    } = options;

    const decimalPlaces = 5; //FIXME: Needs addressing

    // Callback for fetching historical data
    const query = useCallback(
      async (from: Date, to: Date, interval: Interval, merge = true) => {
        const newData = await dataSource.query(
          interval,
          from.toISOString(),
          to.toISOString()
        );

        setData((data) => mergeData(newData, merge ? data : []));
        setLoading(false);
      },
      [dataSource]
    );

    const handleClosePane = useCallback(
      (id: string) => {
        onOptionsChanged({
          ...options,
          studies: studies.filter((study) => study !== id),
        });
      },
      [onOptionsChanged, options, studies]
    );

    // Wait for data source onReady call before showing content
    const { ready: dataSourceInitializing, configuration } =
      useOnReady(dataSource);

    // Initial data fetch and subscriptions
    useEffect(() => {
      const fetchData = async (interval: Interval) => {
        await query(
          new Date(
            new Date().getTime() -
              1000 * 60 * getSubMinutes(interval, initialNumCandlesToFetch)
          ),
          new Date(),
          interval,
          false
        );

        setInternalInterval(interval);
      };

      function subscribe(interval: Interval) {
        dataSource.subscribeData(interval, (datum) => {
          setData((data) => mergeData([datum], data));
        });
      }

      if (!dataSourceInitializing) {
        const myDataSource = dataSource;

        // Initial data fetch
        fetchData(interval);

        // Set up subscriptions
        subscribe(interval);

        return () => {
          myDataSource.unsubscribeData();
          setData([]);
        };
      }
    }, [
      dataSource,
      dataSourceInitializing,
      initialNumCandlesToFetch,
      interval,
      query,
    ]);

    const specification = useMemo(
      () =>
        constructTopLevelSpecV2(
          data,
          chartType,
          colors,
          overlays,
          studies,
          configuration?.priceMonitoringBounds
        ),
      [
        data,
        chartType,
        colors,
        overlays,
        studies,
        configuration?.priceMonitoringBounds,
      ]
    );

    // Compile data and view specification into scenegraph ready for rendering
    const scenegraph = useMemo(
      () =>
        parse(
          specification,
          getCandleWidth(internalInterval),
          dataSource.decimalPlaces,
          []
        ),
      [dataSource.decimalPlaces, internalInterval, specification]
    );

    useEffect(() => {
      console.log("New chart?", loading, specification, axisRef.current);

      if (!loading && specification && axisRef.current) {
        console.log("New chart");
        chartRef.current = new Chart({
          container: containerRef.current,
          timeAxis: axisRef.current,
          resolution: window.devicePixelRatio,
        })
          .on("bounds_changed", (bounds: Bounds) => {
            //handleBoundsChanged(bounds);
          })
          .on("mousemove", (index: number, id: string) => {
            //handleDataIndexChanged(index);
          })
          .on("mouseout", () => {
            //handleDataIndexChanged(null);
          });
      }
    }, [handleBoundsChanged, handleDataIndexChanged, loading, specification]);

    useEffect(() => {
      if (!loading && scenegraph) {
        const ids = scenegraph.panes.map((pane) => pane.id);

        const enter = ids.map((id) => !previousIds.current.includes(id));
        const exit = previousIds.current.map((id) => !ids.includes(id));

        for (let i = exit.length - 1; i >= 0; i--) {
          if (exit[i]) {
            chartRef.current?.removePane(i);
          }
        }

        enter.forEach((flag, index) => {
          if (flag) {
            if (paneRef.current[ids[index]]) {
              const pane = new Pane(paneRef.current[ids[index]], {
                closable: true,
                resolution: window.devicePixelRatio,
              });

              if (scenegraph.panes[index].yDomain) {
                pane.domain = scenegraph.panes[index].yDomain as [
                  number,
                  number
                ];
              }

              pane.renderableObjects = scenegraph.panes[index].objects as any;

              chartRef.current?.addPane(pane);
            }
          }
        });

        previousIds.current = ids;
      }
    }, [loading, scenegraph, studies]);

    useEffect(() => {
      if (scenegraph && !loading) {
        chartRef.current.data = scenegraph.panes[0].originalData;
      }
    }, [loading, scenegraph]);

    // Show fallback UI while waiting for data
    if (loading) {
      return <NonIdealState title="Loading" />;
    }

    // We failed to construct a scenegraph. Something went wrong with the data
    if (!scenegraph) {
      return <NonIdealState title="No data found" />;
    }

    return (
      <div ref={containerRef} className={styles.container}>
        <div className={styles.panesContainer}>
          <Allotment vertical>
            {scenegraph.panes.map((pane, paneIndex) => (
              <Allotment.Pane key={pane.id}>
                <PaneView
                  key={pane.id}
                  ref={(el: HTMLElement | null) => {
                    if (el) {
                      paneRef.current[pane.id] = el;
                    } else {
                      delete paneRef.current[pane.id];
                    }
                  }}
                  closable={paneIndex > 0}
                  onClose={() => {
                    handleClosePane(pane.id);
                  }}
                >
                  <IndicatorInfo
                    title={studyInfoFields[simple ? "simple" : pane.name].label}
                    info={studyInfoFields[
                      simple ? "simple" : pane.name
                    ].fields.map((field) => {
                      const value = getStudyInfoFieldValue(
                        pane.originalData,
                        dataIndex,
                        field.id
                      );

                      return {
                        id: field.id,
                        label: field.label,
                        value: field.format
                          ? field.format(value, decimalPlaces)
                          : formatter(value, decimalPlaces),
                        intent: getIntent(field, value),
                      };
                    })}
                  />
                </PaneView>
              </Allotment.Pane>
            ))}
          </Allotment>
        </div>
        <div className={styles.timeAxisContainer}>
          <PaneView
            ref={(el: HTMLElement | null) => {
              axisRef.current = el;
            }}
            closable={false}
          />
        </div>
      </div>
    );
  }
);

CandlestickChart.displayName = "CandlestickChart";
