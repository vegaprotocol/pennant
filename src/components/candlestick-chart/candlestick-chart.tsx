import "banderole/dist/style.css";

import { Banderole } from "banderole";
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
import { Pane } from "./pane";

export interface StudyOptions {
  id: string;
  study: Study;
}
export interface Options {
  chartType?: ChartType;
  initialNumCandlesToFetch?: number;
  studies: StudyOptions[];
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
        initialNumCandlesToFetch: INITIAL_NUM_CANDLES_TO_FETCH,
      },
      onOptionsChanged,
    }: CandlestickChartProps,
    ref: React.Ref<CandlestickChartHandle>
  ) => {
    const chartRef = useRef<Chart>(null!);
    const paneRef = useRef<Record<string, HTMLElement>>({});
    const axisRef = useRef<HTMLElement | null>(null);
    const previousIds = useRef<string[]>([]);

    // State
    const [bounds, setBounds] = useState<Bounds | null>(null);
    const [data, setData] = useState<Candle[]>([]);
    const [dataIndex, setDataIndex] = useState<number | null>(null);
    const [internalInterval, setInternalInterval] = useState(interval);

    const handleBoundsChanged = useMemo(
      () => throttle(setBounds, THROTTLE_INTERVAL),
      []
    );

    const handleDataIndexChanged = useMemo(
      () => throttle(setDataIndex, THROTTLE_INTERVAL),
      []
    );

    const chartType = options.chartType ?? ChartType.CANDLE;
    const initialNumCandlesToFetch =
      options.initialNumCandlesToFetch ?? INITIAL_NUM_CANDLES_TO_FETCH;
    const simple = options.simple ?? false;
    const studies = useMemo(() => options.studies ?? [], [options.studies]);

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
      },
      [dataSource]
    );

    const handleClosePane = (id: string) => {
      const index = studies.findIndex((study) => study.id === id);

      if (index !== -1) {
        const newStudies = [...options.studies];
        newStudies.splice(index, 1);

        onOptionsChanged?.({
          ...options,
          studies: newStudies,
        });
      }
    };

    // Wait for data source onReady call before showing content
    const { loading, configuration } = useOnReady(dataSource);

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

      if (!loading) {
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
    }, [dataSource, initialNumCandlesToFetch, interval, loading, query]);

    const specification = useMemo(
      () =>
        constructTopLevelSpecV2(
          data,
          chartType,
          undefined,
          studies,
          configuration?.priceMonitoringBounds
        ),
      [chartType, data, configuration?.priceMonitoringBounds, studies]
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
      if (!loading && specification && axisRef.current) {
        chartRef.current = new Chart(axisRef.current)
          .on("bounds_changed", (bounds: Bounds) => {
            handleBoundsChanged(bounds);
          })
          .on("mousemove", (index: number, id: string) => {
            handleDataIndexChanged(index);
          })
          .on("mouseout", () => {
            handleDataIndexChanged(null);
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
              chartRef.current?.addPane(
                new Pane(paneRef.current[ids[index]], { closable: true })
              );
            }
          }
        });

        previousIds.current = ids;
      }
    }, [loading, scenegraph, studies]);

    // Show fallback UI while waiting for data
    if (loading) {
      return <NonIdealState title="Loading" />;
    }

    // We failed to construct a scenegraph. Something went wrong with the data
    if (!scenegraph) {
      return <NonIdealState title="No data found" />;
    }

    return (
      <div className={styles.container}>
        <div className={styles.panesContainer}>
          <Banderole vertical>
            {scenegraph.panes.map((pane, paneIndex) => (
              <Banderole.Pane>
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
              </Banderole.Pane>
            ))}
          </Banderole>
        </div>
        <div className={styles.timeAxisContainer}>
          <PaneView
            ref={(el: HTMLElement | null) => {
              axisRef.current = el;
            }}
            closable={false}
          ></PaneView>
        </div>
      </div>
    );
  }
);

CandlestickChart.displayName = "CandlestickChart";
