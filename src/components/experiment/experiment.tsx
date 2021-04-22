import "@d3fc/d3fc-element";

import React, { createRef, useEffect, useMemo, useRef, useState } from "react";
import { zoom as d3Zoom, zoomTransform } from "d3-zoom";

import AutoSizer from "react-virtualized-auto-sizer";
import { FcElement } from "../../types";
import { chart } from "./chart";
import { plotArea } from "./plot-area";
import { range } from "d3-array";
import { scaleLinear } from "d3-scale";
import { select } from "d3-selection";
import { xAxis as xAxisElement } from "./x-axis";
import { yAxis } from "./y-axis";

const format = (date: number | Date | undefined) =>
  new Intl.DateTimeFormat("en-US").format(date);

export type ExperimentProps = {
  numPlotAreas?: number;
  initialBounds?: [Date, Date];
};

export const Experiment = ({
  numPlotAreas = 3,
  initialBounds = [new Date(2020, 1, 1), new Date(2020, 2, 1)],
}: ExperimentProps) => {
  return (
    <div
      style={{
        height: "60vh",
        width: "60vw",
        flexDirection: "column",
        resize: "both",
        overflow: "hidden",
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

  const refs = range(numPlotAreas).reduce((acc, value) => {
    acc[value] = createRef<HTMLDivElement>();
    return acc;
  }, {} as { [index: number]: React.RefObject<HTMLDivElement> });

  const chartElement = useRef<any>(null);

  useEffect(() => {
    chartElement.current = (chart(
      Object.fromEntries(
        range(numPlotAreas).map((index) => [
          String(index),
          { id: String(index), ref: refs[index], data: [] },
        ])
      ),
      { ref: xAxisRef, data: [] },
      initialBounds
    ).on("redraw", () => {}) as any).on(
      "bounds_changed",
      (bounds: [Date, Date]) => {
        setX(bounds);
      }
    );
  }, []);

  useEffect(() => {
    if (xAxisRef.current) {
      chartElement.current.plotAreas(
        Object.fromEntries(
          range(numPlotAreas).map((index) => [
            String(index),
            { id: String(index), ref: refs[index], data: [] },
          ])
        )
      );

      chartRef.current?.requestRedraw();
    }
  }, [chartElement, numPlotAreas, refs]);

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
      {range(numPlotAreas).map((index) => (
        <React.Fragment key={index}>
          <div
            ref={refs[index]}
            style={{
              position: "relative",
              flex: 1,
              display: "flex",
              flexDirection: "row",
            }}
          >
            <d3fc-canvas
              id={`plot-area-${index}`}
              class="plot-area"
              style={{
                position: "absolute",
                flex: 1,
                width: "100%",
                height: "100%",
              }}
            ></d3fc-canvas>
            <d3fc-svg
              id={`plot-area-interaction-${index}`}
              class="plot-area-interaction"
              style={{
                position: "absolute",
                flex: 1,
                width: "100%",
                height: "100%",
              }}
            ></d3fc-svg>
            <d3fc-svg
              id="y-axis-${index}"
              class="y-axis"
              style={{
                position: "absolute",
                right: 0,
                width: "20px",
                height: "100%",
                cursor: "ns-resize",
              }}
            ></d3fc-svg>
            <div style={{}}>{`${format(x[0])} - ${format(x[1])}`}</div>
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
