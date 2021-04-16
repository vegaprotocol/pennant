import "./chart.scss";

import * as React from "react";

import {
  Annotation,
  ChartType,
  DataSource,
  Overlay,
  PriceMonitoringBounds,
  Study,
} from "../../types";
import { constructTopLevelSpec, getCandleWidth } from "../../helpers";

import AutoSizer from "react-virtualized-auto-sizer";
import { CandleInfo } from "../candle-info";
import { ChartInfo } from "../chart-info";
import { ChartElement } from "../../types";
import { Interval } from "../../stories/api/vega-graphql";
import { NonIdealState } from "../non-ideal-state";
import { PlotContainer } from "../plot-container";
import { PriceMonitoringInfo } from "../price-monitoring-info";
import { StudyInfo } from "../study-info";
import { mergeData } from "../../helpers";
import { parse } from "../../scenegraph/parse";

export type ChartProps = {
  dataSource: DataSource;
  chartType?: ChartType;
  study?: Study;
  overlay?: Overlay;
  interval: Interval;
  onClick?: (id: string) => void;
};

const StudyLabel = new Map<
  Study,
  { label: string; producedFields: { field: string; label: string }[] }
>([
  [
    "eldarRay",
    {
      label: "Eldar-ray",
      producedFields: [
        { field: "bullPower", label: "Bull" },
        { field: "bearPower", label: "Bear" },
      ],
    },
  ],
  [
    "macd",
    {
      label: "MACD",
      producedFields: [
        { field: "signal", label: "S" },
        { field: "macd", label: "M" },
        { field: "divergence", label: "D" },
      ],
    },
  ],
  [
    "volume",
    {
      label: "Volume",
      producedFields: [{ field: "volume", label: "V" }],
    },
  ],
]);

export const Chart = React.forwardRef(
  (
    {
      dataSource,
      chartType = "candle",
      study,
      overlay,
      interval,
      onClick = () => {},
    }: ChartProps,
    ref: React.Ref<ChartElement>
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
      snapshot: () => {
        return chartRef.current.snapshot();
      },
    }));

    const chartRef = React.useRef<ChartElement>(null!);
    const [data, setData] = React.useState<any[]>([]);
    const [annotations, setAnnotations] = React.useState<Annotation[]>([]);

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

    const specification = React.useMemo(
      () =>
        constructTopLevelSpec(
          data,
          chartType,
          overlay,
          study,
          priceMonitoringBounds
        ),
      [chartType, data, overlay, priceMonitoringBounds, study]
    );

    // Compile data and view specification into scenegraph ready for rendering
    const scenegraph = React.useMemo(() => {
      return parse(
        specification,
        getCandleWidth(interval),
        dataSource.decimalPlaces,
        annotations
      );
    }, [annotations, dataSource.decimalPlaces, interval, specification]);

    // Fetch historical data
    const query = React.useCallback(
      async (from: string, to: string, merge = true) => {
        const newData = await dataSource.query(interval, from, to);

        // TODO: need convenience functions for calculating range, sorting and distinct values and merging
        setData((data) => mergeData(newData, merge ? data : []));
      },
      [dataSource, interval]
    );

    // Respond to streaming data
    React.useEffect(() => {
      function subscribe() {
        dataSource.subscribeData(interval, (datum) => {
          setData((data) => mergeData([datum], data));
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
        myDataSource.unsubscribeData();
      };
    }, [dataSource, interval, query]);

    // Respond to streaming annotations
    React.useEffect(() => {
      function subscribe() {
        if (dataSource.subscribeAnnotations) {
          dataSource.subscribeAnnotations((annotations) => {
            setAnnotations(annotations);
          });
        }
      }

      const myDataSource = dataSource;

      subscribe();

      return () => {
        myDataSource.unsubscribeAnnotations &&
          myDataSource.unsubscribeAnnotations();
      };
    }, [dataSource]);

    React.useEffect(() => {
      setIsLoading(true);

      dataSource.onReady().then((configuration) => {
        console.info(`Data Source ready:`, configuration);
        setIsLoading(false);

        if (configuration.priceMonitoringBounds.length > 0) {
          setPriceMonitoringBounds(configuration.priceMonitoringBounds[0]);
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
      return <NonIdealState title="Loading" />;
    }

    return !isLoading && scenegraph ? (
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
              specification={specification}
              scenegraph={scenegraph}
              interval={interval}
              decimalPlaces={dataSource.decimalPlaces}
              plotOverlay={
                <div className="overlay">
                  <ChartInfo bounds={bounds} />
                  <CandleInfo
                    candle={data[selectedIndex ?? data.length - 1]}
                    decimalPlaces={dataSource.decimalPlaces}
                  />
                </div>
              }
              studyOverlay={
                <div className="overlay">
                  {study && selectedIndex !== null && (
                    <StudyInfo
                      title={StudyLabel.get(study)?.label ?? ""}
                      info={
                        StudyLabel.get(study)?.producedFields.map(
                          (producedField) => ({
                            id: producedField.field,
                            label: producedField.label,
                            value:
                              scenegraph.panels[0].originalData[selectedIndex][
                                producedField.field
                              ]?.toFixed(dataSource.decimalPlaces) ?? "",
                          })
                        ) ?? []
                      }
                      decimalPlaces={dataSource.decimalPlaces}
                    />
                  )}
                </div>
              }
              onBoundsChanged={setBounds}
              onMouseMove={setCandle}
              onMouseOut={handleOnMouseOut}
              onGetDataRange={handleGetDataRange}
            />
          )}
        </AutoSizer>
      </div>
    ) : (
      <NonIdealState title="No data found" />
    );
  }
);
