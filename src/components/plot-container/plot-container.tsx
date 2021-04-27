import "d3-transition";
import "@d3fc/d3fc-element";
import "./plot-container.scss";

import * as React from "react";

import { ChartElement, Scenegraph } from "../../types";
import { ChartInterface, chart } from "../../chart";
import { asyncSnapshot, getCandleWidth, getSubMinutes } from "../../helpers";
import { useEffect, useRef, useState } from "react";

import { ChartInfo } from "../chart-info";
import { FcElement } from "../../types";
import { Interval } from "../../stories/api/vega-graphql";
import { TopLevelSpec } from "../../vega-lite/spec";
import { createRef } from "react";
import { throttle } from "lodash";
import { useWhyDidYouUpdate } from "../../hooks/useWhyDidYouUpdate";

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
  (props: PlotContainerProps, ref: React.Ref<ChartElement>) => {
    const {
      specification,
      scenegraph,
      interval,
      initialBounds,
      onBoundsChanged = () => {},
      onMouseMove,
      onMouseOut,
      onMouseOver,
      onGetDataRange = () => {},
    } = props;

    useWhyDidYouUpdate("PlotContainer", props);

    React.useImperativeHandle(ref, () => ({
      fitBounds: (bounds: [Date, Date]) => {
        //chartElement.current?.fitBounds(bounds);
      },
      panBy: (n: number) => {
        //chartElement.current?.reset();
      },
      panTo: (x: Date) => {
        //chartElement.current?.reset();
      },
      reset: () => {
        chartElement.current?.reset();
      },
      snapshot: async () => {
        return await new Blob(); //chartElement.current?.snapshot();
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
              style={{
                position: "relative",
                flex: 1,
              }}
            >
              <d3fc-canvas
                id={`plot-area-${panel.id}`}
                class="plot-area"
                use-device-pixel-ratio
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                }}
              ></d3fc-canvas>
              <d3fc-canvas
                id={`y-axis-${panel.id}`}
                class="y-axis"
                use-device-pixel-ratio
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                }}
              ></d3fc-canvas>
              <d3fc-svg
                id={`plot-area-interaction-${panel.id}`}
                class="plot-area-interaction"
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  cursor: "crosshair",
                }}
              ></d3fc-svg>
              <d3fc-svg
                id={`y-axis-interaction-${panel.id}`}
                class="y-axis-interaction"
                style={{
                  position: "absolute",
                  right: 0,
                  width: "64px",
                  height: "100%",
                  cursor: "ns-resize",
                }}
              ></d3fc-svg>
              {index === 0 && <ChartInfo bounds={bounds} />}
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
