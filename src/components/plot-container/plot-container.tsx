import "d3-transition";
import "@d3fc/d3fc-element";
import "./plot-container.scss";

import * as React from "react";

import { ChartElement, Scenegraph, Study } from "../../types";
import { ChartInterface, chart } from "../../core";
import {
  asyncSnapshot,
  formatter,
  getCandleWidth,
  getSubMinutes,
} from "../../helpers";
import { useEffect, useRef, useState } from "react";

import { ChartInfo } from "../chart-info";
import { FcElement } from "../../types";
import { Interval } from "../../stories/api/vega-graphql";
import { StudyInfo } from "../study-info";
import { TopLevelSpec } from "../../vega-lite/spec";
import { createRef } from "react";
import { throttle } from "lodash";
import { useWhyDidYouUpdate } from "../../hooks/useWhyDidYouUpdate";

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
  specification: TopLevelSpec;
  scenegraph: Scenegraph;
  interval: Interval;
  initialBounds: [Date, Date];
  onBoundsChanged?: (bounds: [Date, Date]) => void;
  onMouseMove?: (index: number) => void;
  onMouseOut?: () => void;
  onMouseOver?: () => void;
  onRightClick?: (position: [number, number]) => void;
  onGetDataRange?: (from: string, to: string) => void;
};

export const PlotContainer = React.forwardRef(
  (
    {
      specification,
      scenegraph,
      interval,
      initialBounds,
      onBoundsChanged = () => {},
      onMouseMove,
      onMouseOut,
      onMouseOver,
      onGetDataRange = () => {},
    }: PlotContainerProps,
    ref: React.Ref<ChartElement>
  ) => {
    React.useImperativeHandle(ref, () => ({
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

    const data: any[] = React.useMemo(() => specification?.data?.values ?? [], [
      specification,
    ]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const onBoundsChangedThrottled = React.useCallback(
      throttle(onBoundsChanged, 200),
      []
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const onGetDataRangeThrottled = React.useCallback(
      throttle(onGetDataRange, 800),
      []
    );

    const snapshot = React.useCallback(() => asyncSnapshot(chartRef), []);
    const [bounds, setBounds] = useState(initialBounds);
    const [dataIndex, setDataIndex] = useState<number | null>(null);
    const [activePanel, setActivePanel] = useState<string | null>(null);
    const chartRef = useRef<FcElement>(null!);
    const xAxisRef = useRef<HTMLDivElement>(null!);

    const refs = scenegraph.panels
      .map((panel) => panel.id)
      .reduce((acc, value) => {
        acc[value] = createRef<HTMLDivElement>();
        return acc;
      }, {} as { [index: string]: React.RefObject<HTMLDivElement> });

    const chartElement = useRef<ChartInterface | null>(null);

    useEffect(() => {
      chartElement.current = chart(
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
        { ref: xAxisRef, data: [] },
        initialBounds
      )
        .on("redraw", () => {
          chartRef.current?.requestRedraw();
        })
        .on("bounds_changed", (bounds: [Date, Date]) => {
          setBounds(bounds);
        })
        .on("mousemove", (index: number, id: string) => {
          setDataIndex(index);
          setActivePanel(id);
        })
        .on("mouseout", () => {
          setDataIndex(null);
          setActivePanel(null);
        });

      chartRef.current?.requestRedraw();

      requestAnimationFrame(() => chartElement.current?.reset());

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      if (chartElement.current) {
        chartElement.current.plotAreas(
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
          )
        );

        chartRef.current?.requestRedraw();
      }
    }, [chartElement, refs, scenegraph.panels]);

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
        {scenegraph.panels.map((panel, index) => (
          <React.Fragment key={panel.id}>
            <div
              ref={refs[panel.id]}
              className="pane"
              style={{
                position: "relative",
                flex: 1,
              }}
            >
              <d3fc-canvas
                class="plot-area"
                use-device-pixel-ratio
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                }}
              ></d3fc-canvas>
              <d3fc-canvas
                class="y-axis"
                use-device-pixel-ratio
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                }}
              ></d3fc-canvas>
              <d3fc-svg
                class="plot-area-interaction"
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  cursor: "crosshair",
                }}
              ></d3fc-svg>
              <d3fc-svg
                class="y-axis-interaction"
                style={{
                  position: "absolute",
                  right: 0,
                  width: "64px",
                  height: "100%",
                  cursor: "ns-resize",
                }}
              ></d3fc-svg>
              <div className="plot-container__info_overlay">
                {index === 0 && <ChartInfo bounds={bounds} />}
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
                          ][field.field]
                        ),
                      })
                    )}
                  />
                }
              </div>
            </div>
            <div style={{ height: "1px", backgroundColor: "white" }}></div>
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
          ></d3fc-canvas>
          <d3fc-svg
            class="x-axis-interaction"
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              cursor: "ew-resize",
            }}
          ></d3fc-svg>
        </div>
      </d3fc-group>
    );
  }
);
