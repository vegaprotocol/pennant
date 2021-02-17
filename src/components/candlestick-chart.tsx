import * as React from "react";

import { ZoomBehavior, zoom, zoomIdentity, zoomTransform } from "d3-zoom";
import { axisBottom, axisLeft } from "d3-axis";
import { curveStepAfter, line } from "d3-shape";
import { scaleLinear, scaleUtc } from "d3-scale";

import { extent } from "d3-array";
import { select } from "d3-selection";
import { throttle } from "lodash";

const CONTEXT_WIDTH = 600;
const FOCUS_WIDTH = 200;
const HEIGHT = 200;

export type CandleStickChartProps = {
  data: any[];
  onGetDataRange: (from: string, to: string) => void;
};

export const CandlestickChart = ({
  data,
  onGetDataRange,
}: CandleStickChartProps) => {
  const focusRef = React.useRef<SVGSVGElement>(null!);
  const contextRef = React.useRef<SVGSVGElement>(null!);
  const focusZoomRef = React.useRef<ZoomBehavior<SVGSVGElement, any>>();

  const throttledOnGetDataRange = React.useMemo(
    () => throttle(onGetDataRange, 5000),
    [onGetDataRange]
  );

  React.useEffect(() => {
    if (data.length > 0) {
      const xFocus = scaleUtc()
        .domain(
          extent([{ date: new Date(2021, 1, 17) }, ...data], (d) => d.date) as [
            Date,
            Date
          ]
        )
        .range([0, FOCUS_WIDTH]);

      const xContext = scaleUtc()
        .domain(
          extent([{ date: new Date(2021, 1, 17) }, ...data], (d) => d.date) as [
            Date,
            Date
          ]
        )
        .range([0, CONTEXT_WIDTH]);

      const yRange = extent(data, (d) => d.open) as [number, number];

      const y = scaleLinear().domain([652.1002, 668.9113]).range([HEIGHT, 0]);

      const xAxis = (g: any, x: any) =>
        g.attr("transform", `translate(0,${HEIGHT})`).call(
          axisBottom(x)
            .ticks(FOCUS_WIDTH / 80)
            .tickSizeOuter(0)
        );

      const yAxis = (g: any, y: any) =>
        g
          .attr("transform", `translate(0,0)`)
          .call(axisLeft(y).ticks(null, "s"));

      const l = (data: any, x: any) =>
        line<{ date: Date; open: number }>()
          .curve(curveStepAfter)
          .x((d) => x(d.date))
          .y((d) => y(d.open))(data)!;

      if (!focusZoomRef.current) {
        focusZoomRef.current = zoom<SVGSVGElement, any>()
          .scaleExtent([1, 32])
          .extent([
            [0, 0],
            [FOCUS_WIDTH, HEIGHT],
          ])
          .translateExtent([
            [0, -Infinity],
            [FOCUS_WIDTH, Infinity],
          ])
          .on("zoom", (event) => zoomed(event, data));
      } else {
        focusZoomRef.current.on("zoom", (event) => zoomed(event, data));
      }

      const focusSvg = select(focusRef.current);

      const path = focusSvg
        .selectAll("path")
        .data([null])
        .join("path")
        .attr("stroke", "steelblue")
        .attr("fill", "none")
        .attr("d", l(data, xFocus));

      const gx = focusSvg
        .selectAll("g")
        .data([null])
        .join("g")
        .call(xAxis, xFocus);

      focusSvg.selectAll("g").data([null]).join("g").call(yAxis, y);

      const contextSvg = select(contextRef.current);

      const dataPresent = contextSvg
        .selectAll("g.data")
        .data([null])
        .join("g")
        .classed("data", true)
        .selectAll("rect")
        .data([null])
        .join((enter) =>
          enter
            .append("rect")
            .attr("x", 100)
            .attr("y", 0)
            .attr("width", 100)
            .attr("height", HEIGHT)
            .attr("stroke", "none")
            .attr("fill", "#ddd")
        );

      const contextPath = contextSvg
        .selectAll("g.line")
        .data([null])
        .join("g")
        .classed("line", true)
        .selectAll("path")
        .data([null])
        .join((enter) =>
          enter
            .append("path")
            .attr("stroke", "steelblue")
            .attr("fill", "none")
            .attr("d", l(data, xContext))
        );
      const window = contextSvg
        .selectAll("g.window")
        .data([null])
        .join("g")
        .classed("window", true)
        .selectAll("rect")
        .data([null])
        .join((enter) =>
          enter
            .append("rect")
            .attr("x", 100)
            .attr("y", 0)
            .attr("width", 100)
            .attr("height", HEIGHT)
            .attr("stroke", "red")
            .attr("fill", "none")
        );

      focusSvg
        .call(focusZoomRef.current as ZoomBehavior<SVGSVGElement, any>)
        .call(
          (focusZoomRef.current as ZoomBehavior<SVGSVGElement, any>).scaleTo,
          8,
          [xFocus(Date.UTC(2021, 1, 18)), 0]
        );

      function zoomed(event: any, data: any) {
        const xz = event.transform.rescaleX(xFocus);

        path.attr("d", l(data, xz));
        contextPath.attr("d", l(data, xContext));

        const range: [Date, Date] = extent(
          data,
          (d: any) => d.date as Date
        ) as [Date, Date];

        dataPresent
          .attr("x", xContext(range[0]))
          .attr("width", xContext(range[1]) - xContext(range[0]));

        window
          .attr("x", xContext(xz.domain()[0]))
          .attr("width", xContext(xz.domain()[1]) - xContext(xz.domain()[0]));

        gx.call(xAxis, xz);

        if (
          range[0].getTime() +
            (xz.domain()[1].getTime() - xz.domain()[0].getTime()) >
          xz.domain()[0].getTime()
        ) {
          throttledOnGetDataRange(
            new Date(
              range[0].getTime() -
                (xz.domain()[1].getTime() - xz.domain()[0].getTime())
            ).toISOString(),
            range[0].toISOString()
          );
        }
      }
    }
  }, [data, throttledOnGetDataRange]);

  return (
    <div>
      <svg
        ref={focusRef}
        width={FOCUS_WIDTH}
        height={HEIGHT}
        style={{ margin: "8px", border: "1px solid grey" }}
      ></svg>
      <svg
        ref={contextRef}
        width={CONTEXT_WIDTH}
        height={HEIGHT}
        style={{ margin: "8px", border: "1px solid grey" }}
      ></svg>
    </div>
  );
};
