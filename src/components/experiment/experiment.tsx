import "@d3fc/d3fc-element";

import React, { createRef, useEffect, useMemo, useRef, useState } from "react";
import { zoom as d3Zoom, zoomTransform } from "d3-zoom";

import { FcElement } from "../../types";
import { chart } from "./chart";
import { plotArea } from "./plot-area";
import { range } from "d3-array";
import { scaleLinear } from "d3-scale";
import { select } from "d3-selection";
import { xAxis as xAxisElement } from "./x-axis";
import { yAxis } from "./y-axis";

export type ExperimentProps = {
  numPlotAreas?: number;
};

export const Experiment = ({ numPlotAreas = 3 }: ExperimentProps) => {
  const [isPinned, setIsPinned] = useState(true);
  const [isFreePan, setIsFreePan] = useState(false);

  const chartRef = useRef<FcElement>(null!);
  const xAxisRef = useRef<FcElement>(null!);

  const refs = range(numPlotAreas).reduce((acc, value) => {
    acc[value] = createRef<HTMLDivElement>();
    return acc;
  }, {} as { [index: number]: React.RefObject<HTMLDivElement> });

  const chartElement = useRef<any>(null);

  useEffect(() => {
    chartElement.current = chart(
      Object.fromEntries(
        range(numPlotAreas).map((index) => [
          String(index),
          { id: String(index), ref: refs[index], data: [] },
        ])
      ),
      { ref: xAxisRef, data: [] }
    ).on("redraw", () => {
      chartRef.current?.requestRedraw();
    });
  }, []);

  useEffect(() => {
    chartElement.current.plotAreas(
      Object.fromEntries(
        range(numPlotAreas).map((index) => [
          String(index),
          { id: String(index), ref: refs[index], data: [] },
        ])
      )
    );

    chartRef.current?.requestRedraw();
  }, [chartElement, numPlotAreas, refs]);

  /* useEffect(() => {
    const xScale = scaleLinear().domain([0, 10]);
    const zoomTime = d3Zoom<Element, unknown>();
    const gTime = select<Element, unknown>(xAxisRef.current);

    const yScales = range(numPlotAreas).map(() =>
      scaleLinear().domain([0, Math.ceil(20 * Math.random() + 10)])
    );

    const xAxis: any = xAxisElement(xScale).on("drag", (e) => {
      xDragged(e);
    });

    const yAxes: any[] = yScales.map((yScale, index) =>
      yAxis(yScale).on("drag", (e) => {
        dragged(e, index);
      })
    );

    const plotAreas: any[] = yScales.map((yScale, index) =>
      (plotArea(xScale, yScale).on("zoom", (e, t, point) => {
        zoomed(e, t, point, index);
      }) as any).on("dblclick", () => {
        setIsPinned(true);
        setIsFreePan(false);
      })
    );

    const zooms = yScales.map(() => d3Zoom<Element, unknown>());

    const gPlotAreas = yScales.map((_yScales, index) =>
      select<Element, unknown>(refs[index].current!)
    );

    const tTime = () => zoomTransform(gTime.node()!);
    const ts = gPlotAreas.map((el) => () => zoomTransform(el.node()!));

    gTime.call(zoomTime);
    gPlotAreas.map((el, index) => el.call(zooms[index]));

    function zoomed(e: any, t: any, point: any, index: number) {
      if (t.k === 1) {
        gTime.call(zoomTime.translateBy, t.x / tTime().k, 0);
        isFreePan &&
          gPlotAreas[index].call(
            zooms[index].translateBy,
            0,
            t.y / ts[index]().k
          );

        setIsPinned(false);
      } else {
        gTime.call(
          zoomTime.scaleBy,
          t.k,
          isPinned ? [xScale.range()[1], 0] : point
        );
      }

      const xr = tTime().rescaleX(xScale);
      const yr = ts[index]().rescaleY(yScales[index]);

      xAxis.xScale(xr);
      plotAreas.forEach((plotArea: any) => plotArea.xScale(xr));
      plotAreas[index].yScale(yr);
      yAxes[index].yScale(yr);

      chartRef.current?.requestRedraw();
    }

    function dragged(e: any, index: number) {
      gPlotAreas[index].call(zooms[index].scaleBy, 1 - e.dy / 128, [0, 64]);
      const yr = ts[index]().rescaleY(yScales[index]);
      plotAreas[index].yScale(yr);
      yAxes[index].yScale(yr);

      setIsFreePan(true);

      chartRef.current?.requestRedraw();
    }

    function xDragged(e: any) {
      gTime.call(
        zoomTime.scaleBy,
        1 - e.dx / (xScale.range()[1] - xScale.range()[0]),
        [
          isPinned
            ? xScale.range()[1]
            : (xScale.range()[1] - xScale.range()[0]) / 2,
          0,
        ]
      );

      const xr = tTime().rescaleX(xScale);
      xAxis.xScale(xr);
      plotAreas.forEach((plotArea) => plotArea.xScale(xr));
      chartRef.current?.requestRedraw();
    }

    const xAxisContainer = select<FcElement, unknown>(xAxisRef.current)
      .on("measure", (event) => {
        const { width } = event.detail;
        xScale.range([0, width]);
      })
      .on("draw", (event) => {
        select(event.currentTarget).select<SVGSVGElement>("svg").call(xAxis);
      });

    range(numPlotAreas).map((index) =>
      select<HTMLDivElement, unknown>(refs[index].current!)
        .select(".y-axis")
        .on("measure", (event) => {
          const { height } = event.detail;
          yScales[index].range([height, 0]);
        })
        .on("draw", (event) => {
          select(event.currentTarget)
            .select<SVGSVGElement>("svg")
            .call(yAxes[index]);
        })
    );

    range(numPlotAreas).map((index) =>
      select<HTMLDivElement, unknown>(refs[index].current!)
        .select(".plot-area")
        .on("draw", (event) => {
          select(event.currentTarget)
            .select<SVGSVGElement>("svg")
            .call(plotAreas[index]);
        })
    );

    chartRef.current?.requestRedraw();
  }, [isFreePan, isPinned, numPlotAreas, refs]); */

  return (
    <d3fc-group
      ref={chartRef}
      id="chart"
      auto-resize
      style={{
        display: "flex",
        height: "40vw",
        width: "60vw",
        flexDirection: "column",
        resize: "both",
        overflow: "hidden",
      }}
    >
      {range(numPlotAreas).map((index) => (
        <React.Fragment key={index}>
          <div
            ref={refs[index]}
            style={{ flex: 1, display: "flex", flexDirection: "row" }}
          >
            <d3fc-svg
              id={`plot-area-${index}`}
              class="plot-area"
              style={{ flex: 1 }}
            ></d3fc-svg>
            <d3fc-svg
              id="y-axis-a"
              class="y-axis"
              style={{ width: "20px", cursor: "ns-resize" }}
            ></d3fc-svg>
          </div>
          <div style={{ height: "1px", backgroundColor: "white" }}></div>
        </React.Fragment>
      ))}
      <div style={{ height: "3em", display: "flex", flexDirection: "row" }}>
        <d3fc-svg
          ref={xAxisRef}
          id="x-axis"
          style={{ flex: 1, marginRight: "20px", cursor: "ew-resize" }}
        ></d3fc-svg>
      </div>
    </d3fc-group>
  );
};
