import "@d3fc/d3fc-element";

import React, { createRef, useEffect, useRef, useState } from "react";

import AutoSizer from "react-virtualized-auto-sizer";
import { ChartInfo } from "../chart-info";
import { FcElement } from "../../types";
import { chart } from "./chart";

const format = (date: number | Date | undefined) =>
  new Intl.DateTimeFormat("en-US").format(date);

export type ExperimentProps = {
  numPlotAreas?: number;
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
  numPlotAreas = 3,
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
        {() => (
          <Chart numPlotAreas={numPlotAreas} initialBounds={initialBounds} />
        )}
      </AutoSizer>
    </div>
  );
};

export const Chart = ({
  numPlotAreas = 3,
  initialBounds = [new Date(2020, 1, 1), new Date(2020, 2, 1)],
}: ExperimentProps) => {
  const [x, setX] = useState(initialBounds);
  const [y, setY] = useState<Record<string, number>>({});

  const chartRef = useRef<FcElement>(null!);
  const xAxisRef = useRef<FcElement>(null!);

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
          { id: String(area.id), ref: refs[area.id], data: area.data },
        ])
      ),
      { ref: xAxisRef, data: [] },
      initialBounds
    ).on("redraw", () => {
      chartRef.current?.requestRedraw();
    }) as any).on("bounds_changed", (bounds: [Date, Date]) => {
      setX(bounds);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (xAxisRef.current) {
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
                flex: 1,
                width: "100%",
                height: "100%",
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
            {index === 0 && <ChartInfo bounds={x} />}
          </div>
          <div style={{ height: "1px", backgroundColor: "white" }}></div>
        </React.Fragment>
      ))}
      <div style={{ height: "3em", display: "flex", flexDirection: "row" }}>
        <d3fc-svg
          ref={xAxisRef}
          id="x-axis"
          style={{ flex: 1, cursor: "ew-resize" }}
        ></d3fc-svg>
      </div>
    </d3fc-group>
  );
};
