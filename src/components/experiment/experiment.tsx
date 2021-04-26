import "@d3fc/d3fc-element";

import React, { createRef, useEffect, useRef, useState } from "react";

import AutoSizer from "react-virtualized-auto-sizer";
import { ChartInfo } from "../chart-info";
import { FcElement } from "../../types";
import { chart } from "./chart";

export type ExperimentProps = {
  initialBounds?: [Date, Date];
};

const plotAreas = [
  {
    id: "main",
    data: [
      { date: new Date(2020, 1, 1), open: 100 },
      { date: new Date(2020, 1, 10), open: 110 },
      { date: new Date(2020, 1, 20), open: 90 },
    ],
  },
  {
    id: "study",
    data: [],
  },
];

export const Experiment = ({
  initialBounds = [new Date(2020, 1, 1), new Date(2020, 2, 1)],
}: ExperimentProps) => {
  return (
    <div
      style={{
        height: "60vh",
        width: "90vw",
        flexDirection: "column",
        resize: "both",
        overflow: "hidden",
        backgroundColor: "black",
      }}
    >
      <AutoSizer style={{ width: "100%", height: "100%" }}>
        {() => <Chart initialBounds={initialBounds} />}
      </AutoSizer>
    </div>
  );
};

export const Chart = ({
  initialBounds = [new Date(2020, 1, 1), new Date(2020, 2, 1)],
}: ExperimentProps) => {
  const [bounds, setBounds] = useState(initialBounds);
  const chartRef = useRef<FcElement>(null!);
  const xAxisRef = useRef<HTMLDivElement>(null!);

  const refs = plotAreas
    .map((area) => area.id)
    .reduce((acc, value) => {
      acc[value] = createRef<HTMLDivElement>();
      return acc;
    }, {} as { [index: string]: React.RefObject<HTMLDivElement> });

  const chartElement = useRef<any>(null);

  useEffect(() => {
    chartElement.current = (chart(
      Object.fromEntries(
        plotAreas.map((area) => [
          area.id,
          {
            id: String(area.id),
            ref: refs[area.id],
            data: area.data,
            initialBounds: [0, 140],
          },
        ])
      ),
      { ref: xAxisRef, data: [] },
      initialBounds
    ).on("redraw", () => {
      chartRef.current?.requestRedraw();
    }) as any).on("bounds_changed", (bounds: [Date, Date]) => {
      setBounds(bounds);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (chartElement.current) {
      chartElement.current.plotAreas(
        Object.fromEntries(
          plotAreas.map((area) => [
            String(area.id),
            { id: String(area.id), ref: refs[area.id], data: [] },
          ])
        )
      );

      chartRef.current?.requestRedraw();
    }
  }, [chartElement, refs]);

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
      {plotAreas.map((area, index) => (
        <React.Fragment key={area.id}>
          <div
            ref={refs[area.id]}
            style={{
              position: "relative",
              flex: 1,
            }}
          >
            <d3fc-canvas
              id={`plot-area-${area.id}`}
              class="plot-area"
              use-device-pixel-ratio
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
              }}
            ></d3fc-canvas>
            <d3fc-canvas
              id={`y-axis-${area.id}`}
              class="y-axis"
              use-device-pixel-ratio
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
              }}
            ></d3fc-canvas>
            <d3fc-svg
              id={`plot-area-interaction-${area.id}`}
              class="plot-area-interaction"
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                cursor: "crosshair",
              }}
            ></d3fc-svg>
            <d3fc-svg
              id={`y-axis-interaction-${area.id}`}
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
};
