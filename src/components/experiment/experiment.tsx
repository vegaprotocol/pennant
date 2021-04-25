import "@d3fc/d3fc-element";
import "./experiment.scss";

import React, { createRef, useEffect, useRef, useState } from "react";

import AutoSizer from "react-virtualized-auto-sizer";
import { ChartInfo } from "../chart-info";
import { FcElement } from "../../types";
// @ts-ignore
import Split from "react-split-grid";
import { chart } from "./chart";
import { Panel } from "./panel";

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
    id: "study-0",
    data: [],
  },
  {
    id: "study-1",
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
      <AutoSizer
        style={{ width: "100%", height: "100%" }}
        onResize={() => console.log("Eeeee orrrr")}
      >
        {() => <Chart initialBounds={initialBounds} />}
      </AutoSizer>
    </div>
  );
};

export const Chart = ({
  initialBounds = [new Date(2020, 1, 1), new Date(2020, 2, 1)],
}: ExperimentProps) => {
  const [x, setX] = useState(initialBounds);
  const [y, setY] = useState<Record<string, number>>({});

  const chartRef = useRef<FcElement>(null!);
  const xAxisRef = useRef<HTMLDivElement>(null!);

  let refs = plotAreas
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
  });

  useEffect(() => {
    chartElement.current.plotAreas(
      Object.fromEntries(
        plotAreas.map((area) => [
          String(area.id),
          { id: String(area.id), ref: refs[area.id], data: [] },
        ])
      )
    );

    chartRef.current?.requestRedraw();
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
      <Split
        minSize={100}
        cursor="row-resize"
        render={({
          getGridProps,
          getGutterProps,
        }: {
          getGridProps: any;
          getGutterProps: any;
        }) => (
          <div
            className="grid"
            style={{
              gridTemplateRows: `${"1fr 8px ".repeat(plotAreas.length - 1)}1fr`,
            }}
            {...getGridProps()}
          >
            {plotAreas.map((area, index) => (
              <React.Fragment key={area.id}>
                <div key={area.id} style={{ height: "100%" }}>
                  <Panel
                    ref={refs[area.id]}
                    id={area.id}
                    bounds={x}
                    showChartInfo={index === 0}
                    onResize={() => {
                      chartRef.current?.requestRedraw();
                    }}
                  />
                </div>
                {index < plotAreas.length - 1 && (
                  <div
                    className={`gutter-row gutter-row-${2 * index + 1}`}
                    {...getGutterProps("row", 2 * index + 1)}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      />
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
