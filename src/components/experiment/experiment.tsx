import "@d3fc/d3fc-element";

import { createRef, useEffect } from "react";
import { zoom as d3Zoom, zoomTransform } from "d3-zoom";

import { FcElement } from "../../types";
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
  const refs = range(numPlotAreas).reduce((acc, value) => {
    acc[value] = createRef<HTMLDivElement>();
    return acc;
  }, {} as { [index: number]: React.RefObject<HTMLDivElement> });

  useEffect(() => {
    const xScale = scaleLinear().domain([0, 10]);
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
      plotArea(xScale, yScale).on("zoom", (t, point) => {
        zoomed(t, point, index);
      })
    );

    const zoomTime = d3Zoom<Element, unknown>();
    const zooms = yScales.map(() => d3Zoom<Element, unknown>());

    const gTime = select<Element, unknown>("#x-axis");
    const gPlotAreas = yScales.map((_yScales, index) =>
      select<Element, unknown>(refs[index].current!)
    );

    const tTime = () => zoomTransform(gTime.node()!);
    const ts = gPlotAreas.map((el) => () => zoomTransform(el.node()!));

    gTime.call(zoomTime);
    gPlotAreas.map((el, index) => el.call(zooms[index]));

    function zoomed(t: any, point: any, index: number) {
      if (t.k === 1) {
        gTime.call(zoomTime.translateBy, t.x / tTime().k, 0);
        gPlotAreas[index].call(
          zooms[index].translateBy,
          0,
          t.y / ts[index]().k
        );
      } else {
        gTime.call(zoomTime.scaleBy, t.k, point);
      }

      const xr = tTime().rescaleX(xScale);
      const yr = ts[index]().rescaleY(yScales[index]);

      xAxis.xScale(xr);
      plotAreas.forEach((plotArea: any) => plotArea.xScale(xr));
      plotAreas[index].yScale(yr);

      select<FcElement, unknown>("#chart").node()?.requestRedraw();
    }

    function dragged(e: any, index: number) {
      gPlotAreas[index].call(zooms[index].scaleBy, 1 - e.dy / 128, [0, 64]);

      const yr = ts[index]().rescaleY(yScales[index]);

      plotAreas[index].yScale(yr);
      yAxes[index].yScale(yr);

      select<FcElement, unknown>("#chart").node()?.requestRedraw();
    }

    function xDragged(e: any) {
      gTime.call(zoomTime.scaleBy, 1 - e.dx / 564, [564, 0]);

      const xr = tTime().rescaleX(xScale);

      xAxis.xScale(xr);

      plotAreas.forEach((plotArea) => plotArea.xScale(xr));

      select<FcElement, unknown>("#chart").node()?.requestRedraw();
    }

    const xAxisContainer = select<FcElement, unknown>("#x-axis")
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
          yScales[index].range([0, height]);
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

    select<FcElement, unknown>("#chart").node()?.requestRedraw();
  }, [numPlotAreas, refs]);

  return (
    <d3fc-group
      id="chart"
      auto-resize
      style={{
        display: "flex",
        height: "40vw",
        width: "60vw",
        flexDirection: "column",
      }}
    >
      {range(numPlotAreas).map((index) => (
        <div
          ref={refs[index]}
          key={index}
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
            style={{ width: "5em", cursor: "ns-resize" }}
          ></d3fc-svg>
        </div>
      ))}
      <div style={{ height: "3em", display: "flex", flexDirection: "row" }}>
        <d3fc-svg
          id="x-axis"
          style={{ flex: 1, marginRight: "5em", cursor: "ew-resize" }}
        ></d3fc-svg>
      </div>
    </d3fc-group>
  );
};
