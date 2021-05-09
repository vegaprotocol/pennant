import "d3-transition";
import "@d3fc/d3fc-element";
import "./plot-container.scss";

import * as React from "react";

import { Viewport, ChartElement, Scenegraph, Bounds } from "../../types";
import { asyncSnapshot, Colors, formatter, getSubMinutes } from "../../helpers";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import { ChartInfo } from "../chart-info";
import { FcElement } from "../../types";
import { Interval } from "../../stories/api/vega-graphql";
import { StudyInfo } from "../study-info";
import { createRef } from "react";
import { throttle } from "lodash";
import { THROTTLE_INTERVAL, WIDTH } from "../../constants";
import { CloseButton } from "./close-button";
import { Core } from "../../core";

const StudyInfoFields: Record<
  string,
  { label: string; fields: { field: string; label: string }[] }
> = {
  main: {
    label: "Candle",
    fields: [
      { field: "open", label: "O" },
      { field: "high", label: "H" },
      { field: "low", label: "L" },
      { field: "close", label: "C" },
    ],
  },
  eldarRay: {
    label: "Eldar-ray",
    fields: [
      { field: "bullPower", label: "Bull" },
      { field: "bearPower", label: "Bear" },
    ],
  },
  macd: {
    label: "MACD",
    fields: [
      { field: "signal", label: "S" },
      { field: "divergence", label: "D" },
      { field: "macd", label: "MACD" },
    ],
  },
  volume: {
    label: "Volume",
    fields: [{ field: "volume", label: "V" }],
  },
};

export type PlotContainerProps = {
  width: number;
  height: number;
  decimalPlaces: number;
  scenegraph: Scenegraph;
  interval: Interval;
  initialViewport: Viewport;
  onViewportChanged?: (viewport: Viewport) => void;
  onRightClick?: (position: [number, number]) => void;
  onGetDataRange?: (from: Date, to: Date, interval: Interval) => void;
  onClosePanel: (id: string) => void;
};

export const PlotContainer = forwardRef(
  (
    {
      scenegraph,
      interval,
      initialViewport,
      decimalPlaces,
      onViewportChanged = () => {},
      onGetDataRange = () => {},
      onClosePanel,
    }: PlotContainerProps,
    ref: React.Ref<ChartElement>
  ) => {
    useImperativeHandle(ref, () => ({
      panBy: (n: number) => {
        chartElement.current?.panBy(n);
      },
      reset: () => {
        chartElement.current?.reset();
      },
      snapshot: async () => {
        return snapshot();
      },
      zoomIn: (delta: number) => {
        chartElement.current?.zoomIn(delta);
      },
      zoomOut: (delta: number) => {
        chartElement.current?.zoomOut(delta);
      },
    }));

    const onViewportChangedThrottled = useMemo(
      () => throttle(onViewportChanged, 200),
      [onViewportChanged]
    );

    const onGetDataRangeThrottled = useMemo(
      () => throttle(onGetDataRange, 800),
      [onGetDataRange]
    );

    const snapshot = React.useCallback(() => asyncSnapshot(chartRef), []);
    const [bounds, setBounds] = useState<Bounds | null>(null);
    const [dataIndex, setDataIndex] = useState<number | null>(null);
    const [showPaneControls, setShowPaneControls] = useState<string | null>(
      null
    );
    const chartRef = useRef<FcElement>(null!);
    const xAxisRef = useRef<HTMLDivElement>(null!);

    const handleBoundsChanged = useMemo(
      () => throttle(setBounds, THROTTLE_INTERVAL),
      []
    );

    const handleDataIndexChanged = useMemo(
      () => throttle(setDataIndex, THROTTLE_INTERVAL),
      []
    );

    const handleViewportChanged = useMemo(
      () => throttle(onViewportChanged, THROTTLE_INTERVAL),
      [onViewportChanged]
    );

    const refs = useMemo(
      () =>
        scenegraph.panels
          .map((panel) => panel.id)
          .reduce((acc, value) => {
            acc[value] = createRef<HTMLDivElement>();
            return acc;
          }, {} as { [index: string]: React.RefObject<HTMLDivElement> }),
      [scenegraph.panels]
    );

    const chartElement = useRef<Core | null>(null);

    useEffect(() => {
      chartElement.current = new Core(
        Object.fromEntries(
          scenegraph.panels.map((panel) => [
            panel.id,
            {
              id: String(panel.id),
              ref: refs[panel.id],
              data: panel.originalData,
              renderableElements: panel.renderableElements.flat(1),
              yEncodingFields: panel.yEncodingFields,
            },
          ])
        ),
        {
          ref: xAxisRef,
          data: scenegraph.panels[0].originalData.map((d) => d.date),
        },
        initialViewport,
        decimalPlaces
      )
        .interval(1000 * 60 * getSubMinutes(interval, 1))
        .on("redraw", () => {
          chartRef.current?.requestRedraw();
        })
        .on("bounds_changed", (bounds: Bounds) => {
          handleBoundsChanged(bounds);
        })
        .on("viewport_changed", (viewport: Viewport) => {
          handleViewportChanged(viewport);
        })
        .on("mousemove", (index: number, id: string) => {
          handleDataIndexChanged(index);
        })
        .on("mouseout", () => {
          handleDataIndexChanged(null);
        })
        .on("fetch_data", (from: Date, to: Date) => {
          onGetDataRangeThrottled(from, to, interval);
        });

      chartRef.current?.requestRedraw();

      requestAnimationFrame(() =>
        chartElement.current?.initialize(initialViewport)
      );

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update interval and fetch data callback
    useEffect(() => {
      if (chartElement.current) {
        chartElement.current
          .interval(1000 * 60 * getSubMinutes(interval, 1))
          .on("fetch_data", (from: Date, to: Date) => {
            onGetDataRangeThrottled(from, to, interval);
          });
      }
    }, [interval, onGetDataRangeThrottled]);

    useEffect(() => {
      if (chartElement.current) {
        chartElement.current.update(
          Object.fromEntries(
            scenegraph.panels.map((panel) => [
              panel.id,
              {
                id: String(panel.id),
                ref: refs[panel.id],
                data: panel.originalData,
                renderableElements: panel.renderableElements.flat(1),
                yEncodingFields: panel.yEncodingFields,
              },
            ])
          ),
          {
            ref: xAxisRef,
            data: scenegraph.panels[0].originalData.map((d) => d.date),
          }
        );

        chartRef.current?.requestRedraw();
      }
    }, [chartElement, refs, scenegraph.panels]);

    useEffect(() => {
      if (chartElement.current) {
        chartElement.current.interval(1000 * 60 * getSubMinutes(interval, 1));
      }
    }, [interval]);

    return (
      <d3fc-group
        ref={chartRef}
        id="chart"
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          flexDirection: "column",
        }}
      >
        {scenegraph.panels.map((panel, panelIndex) => (
          <React.Fragment key={panel.id}>
            <div
              ref={refs[panel.id]}
              className="pane"
              style={{
                position: "relative",
                flex: 1,
              }}
              onMouseOver={() => setShowPaneControls(panel.id)}
              onMouseOut={() => setShowPaneControls(null)}
            >
              <d3fc-canvas
                class="plot-area"
                use-device-pixel-ratio
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                }}
              />
              <d3fc-canvas
                class="y-axis"
                use-device-pixel-ratio
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                }}
              />
              <d3fc-svg
                class="plot-area-interaction"
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  cursor: "crosshair",
                }}
              />
              <d3fc-svg
                class="y-axis-interaction"
                style={{
                  position: "absolute",
                  right: 0,
                  width: `${WIDTH}px`,
                  height: "100%",
                  cursor: "ns-resize",
                }}
              />
              {panel.id !== "main" && (
                <div
                  className="plot-container__close-button-wrapper"
                  style={{
                    right: `${WIDTH}px`,
                    opacity: showPaneControls === panel.id ? 1 : 0,
                    visibility:
                      showPaneControls === panel.id ? "visible" : "hidden",
                  }}
                >
                  <div
                    className="plot-container__close-button"
                    onClick={() => {
                      onClosePanel(panel.id);
                    }}
                  >
                    <CloseButton size={16} />
                  </div>
                </div>
              )}
              <div className="plot-container__info_overlay">
                {panelIndex === 0 && bounds && <ChartInfo bounds={bounds} />}
                {
                  <StudyInfo
                    title={StudyInfoFields[panel.id].label}
                    info={StudyInfoFields[panel.id].fields.map(
                      (field: any) => ({
                        id: field.field,
                        label: field.label,
                        value: formatter(
                          panel.originalData[
                            dataIndex ?? panel.originalData.length - 1
                          ][field.field],
                          decimalPlaces
                        ),
                      })
                    )}
                  />
                }
              </div>
            </div>
            <div
              style={{ height: "1px", backgroundColor: Colors.GRAY_LIGHT_1 }}
            ></div>
          </React.Fragment>
        ))}
        <div ref={xAxisRef} style={{ height: "24px", position: "relative" }}>
          <d3fc-canvas
            class="x-axis"
            use-device-pixel-ratio
            style={{
              position: "absolute",
              cursor: "ew-resize",
              width: "100%",
              height: "100%",
            }}
          />
          <d3fc-svg
            class="x-axis-interaction"
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              cursor: "ew-resize",
            }}
          />
        </div>
      </d3fc-group>
    );
  }
);
