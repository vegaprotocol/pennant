import "d3-transition";
import "@d3fc/d3fc-element";
import "./plot-container.scss";

import * as React from "react";

import { CandleDetailsExtended, Panel, Scenegraph } from "../types/element";
import { ScaleLinear, scaleLinear, scaleTime } from "d3-scale";
import { zoom as d3Zoom, zoomIdentity } from "d3-zoom";
import { select, selectAll } from "d3-selection";

import { FcElement } from "../types/d3fc-types";
import { Interval } from "../api/vega-graphql";
import { PlotArea } from "./plot-area";
import { View } from "../types/vega-spec-types";
import { WIDTH } from "../constants";
import { XAxis } from "./x-axis";
import { drawChart } from "../render";
import { extent } from "d3-array";
import { getCandleWidth } from "../helpers";
import { interpolateZoom } from "d3-interpolate";
import { parse } from "../scenegraph/parse";
import { useWhyDidYouUpdate } from "../hooks/useWhyDidYouUpdate";

const timeScale = scaleTime();
const timeScaleRescaled = scaleTime(); // A rescaled copy of the time scale which reflects the user panning and scaling

export type PlotContainerProps = {
  width: number;
  height: number;
  data: CandleDetailsExtended[];
  view: View[];
  interval: Interval;
  decimalPlaces: number;
  onBoundsChanged?: (bounds: [Date, Date]) => void;
  onMouseMove?: (index: number) => void;
  onMouseOut?: () => void;
  onMouseOver?: () => void;
  onRightClick?: (position: [number, number]) => void;
  onGetDataRange: (from: string, to: string) => void;
};

export const PlotContainer = React.forwardRef(
  (props: PlotContainerProps, ref: React.Ref<{ reset(): void }>) => {
    useWhyDidYouUpdate("PlotContainer", props);

    const {
      width,
      data,
      view,
      interval,
      decimalPlaces,
      onBoundsChanged,
      onMouseMove,
      onMouseOut,
      onMouseOver,
    } = props;

    React.useImperativeHandle(ref, () => ({
      reset: () => {
        reset();
      },
    }));

    // Everything is a ref because we are managing this state ourselves
    // This means we might make this a vanilla JavaScript object in the future
    const isPinnedRef = React.useRef(true);
    const previousZoomTransform = React.useRef(zoomIdentity);
    const chartRef = React.useRef<FcElement>(null!);
    const crosshairXRef = React.useRef<number | null>(null);
    const crosshairsRef = React.useRef<(number | null)[]>(view.map(() => null));
    const scalesRef = React.useRef<ScaleLinear<number, number, never>[]>(
      view.map(() => scaleLinear())
    );

    const domainRef = React.useRef(extent(data, (d) => d.date) as [Date, Date]);

    const candleWidth = getCandleWidth(interval);

    // Compile data and view specification into scenegraph ready for rendering
    const scenegraph: Scenegraph = React.useMemo(
      () => parse(data, view, candleWidth, decimalPlaces),
      [candleWidth, data, decimalPlaces, view]
    );

    const requestRedraw = React.useCallback(function reuqestRedraw() {
      select(chartRef.current).node()?.requestRedraw();
    }, []);

    const zoomControl = React.useMemo(() => {
      return (
        d3Zoom<FcElement, unknown>()
          // @ts-ignore
          .interpolate(interpolateZoom.rho(0))
          .scaleExtent([1 / (1 << 2), 1 << 2])
          .translateExtent([
            [0, 0],
            [0, 800],
          ])
          .constrain(function constrain(transform, extent, translateExtent) {
            if (isPinnedRef.current) {
              const gap =
                transform.invertX(extent[1][0] - WIDTH) -
                (extent[1][0] - WIDTH);

              return transform.translate(gap, 0);
            } else {
              const dx0 =
                transform.invertX(extent[0][0]) - translateExtent[0][0];
              const dx1 =
                transform.invertX(extent[1][0]) - translateExtent[1][0];
              const dy0 =
                transform.invertY(extent[0][1]) - translateExtent[0][1];
              const dy1 =
                transform.invertY(extent[1][1]) - translateExtent[1][1];

              console.log(dx0, dx1, dy0, dy1);

              return transform.translate(
                dx1 > dx0
                  ? (dx0 + dx1) / 2
                  : Math.min(0, dx0) || Math.max(0, dx1),
                dy1 > dy0
                  ? (dy0 + dy1) / 2
                  : Math.min(0, dy0) || Math.max(0, dy1)
              );
            }
          })
          .on("zoom", (event) => {
            drawChart(
              event,
              previousZoomTransform,
              timeScale,
              isPinnedRef,
              timeScaleRescaled,
              data,
              view,
              scalesRef,
              requestRedraw,
              onBoundsChanged
            );
          })
          .on("start", (event) => {
            console.log("starting zoom");
          })
          .on("end", (event) => {
            selectAll(".d3fc-canvas-layer.crosshair").classed(
              "grabbing",
              false
            );
          })
      );
    }, [data, onBoundsChanged, requestRedraw, view]);

    const reset = React.useCallback(
      function reset() {
        select(chartRef.current)
          .transition()
          .duration(750)
          .call(zoomControl.translateTo, timeScaleRescaled.range()[1], 0, [
            timeScaleRescaled.range()[1] - WIDTH,
            0,
          ])
          .end()
          .then(() => {
            isPinnedRef.current = true;
          })
          .catch((reason) =>
            console.warn(`Transition end promise failed: ${reason}`)
          );

        select(chartRef.current).node()?.requestRedraw();
      },
      [zoomControl.translateTo]
    );

    React.useEffect(() => {
      const chartContainer = select(chartRef.current)
        .on(
          "measure",
          (event: { detail: { width: number; pixelRatio: number } }) => {
            const { width, pixelRatio } = event.detail;

            timeScale.range([0, width / pixelRatio]);
          }
        )
        .on("draw", () => {
          timeScale.domain(domainRef.current);
        });

      chartContainer.call(zoomControl);
    }, [zoomControl]);

    React.useEffect(() => {
      const chartContainer = select(chartRef.current);

      if (chartContainer) {
        chartContainer.node()?.requestRedraw();

        chartContainer.call(
          zoomControl.transform,
          zoomIdentity.translate(0, 0)
        );
      }

      if (false && isPinnedRef.current) {
        const domain = timeScale.domain();
        const domainWidth = domain[1].getTime() - domain[0].getTime();

        const latestDate = data[data.length - 1].date;

        timeScale.domain([
          new Date(latestDate.getTime() - domainWidth),
          latestDate,
        ]);
      }
    }, [data, zoomControl.transform]);

    return (
      <d3fc-group ref={chartRef} class="d3fc-group" auto-resize>
        {scenegraph.panels.map((panel: Panel, panelIndex: number) => (
          <React.Fragment key={panel.id}>
            <div className="plot-area">
              <PlotArea
                scenegraph={panel}
                x={timeScaleRescaled}
                y={scalesRef.current![panelIndex]}
                crosshairXRef={crosshairXRef}
                index={panelIndex}
                crosshairYRef={crosshairsRef}
                requestRedraw={requestRedraw}
                onMouseMove={onMouseMove}
                onMouseOut={onMouseOut}
                onMouseOver={onMouseOver}
              />
            </div>
            {panelIndex < scenegraph.panels.length - 1 && (
              <div className="separator">
                <div className="handle"></div>
              </div>
            )}
          </React.Fragment>
        ))}
        <div className="x-axis">
          <XAxis
            scenegraph={scenegraph.xAxis}
            x={timeScaleRescaled}
            y={scalesRef.current![0]} // FIXME: Shouldn't need to pass a y scale for the x-axis
            crosshairXRef={crosshairXRef} // FIXME: If this was an array of objects we wouldn't need to pass in the ref itself and index into it
            requestRedraw={requestRedraw}
            onMouseMove={onMouseMove}
            onMouseOut={onMouseOut}
            onMouseOver={onMouseOver}
          />
        </div>
      </d3fc-group>
    );
  }
);
