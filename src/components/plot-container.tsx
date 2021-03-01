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
import { XAxis } from "./x-axis";
import { drawChart } from "../render";
import { extent } from "d3-array";
import { getCandleWidth } from "../helpers";
import { parse } from "../scenegraph/parse";
import { useWhyDidYouUpdate } from "../hooks/useWhyDidYouUpdate";

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

    const candleWidth = getCandleWidth(interval);

    // Compile data and view specification into scenegraph ready for rendering
    const scenegraph: Scenegraph = React.useMemo(
      () => parse(data, view, candleWidth, decimalPlaces),
      [candleWidth, data, decimalPlaces, view]
    );

    const timeScale = React.useMemo(
      () =>
        scaleTime().domain(
          extent(data, (d: CandleDetailsExtended) => d.date) as [Date, Date]
        ),
      []
    );

    // A rescaled copy of the time scale which reflects the user panning and scaling
    const timeScaleRescaled = React.useMemo(
      () =>
        scaleTime().domain(
          extent(data, (d: CandleDetailsExtended) => d.date) as [Date, Date]
        ),
      []
    );

    const requestRedraw = React.useCallback(function reuqestRedraw() {
      select(chartRef.current).node()?.requestRedraw();
    }, []);

    const zoomControl = React.useMemo(() => {
      return d3Zoom<FcElement, unknown>()
        .scaleExtent([0, 1 << 4])
        .on("zoom", (event) => {
          drawChart(
            event.transform,
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
        .on("start", (event) => {})
        .on("end", (event) => {
          selectAll(".d3fc-canvas-layer.crosshair").classed("grabbing", false);
        });
    }, [
      data,
      onBoundsChanged,
      requestRedraw,
      view,
      timeScale,
      timeScaleRescaled,
    ]);

    const reset = React.useCallback(
      function reset() {
        select(chartRef.current)
          .transition()
          .duration(750)
          .call(zoomControl.translateTo, timeScale.range()[1] + 50, 0, [
            timeScale.range()[1],
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
      [timeScale, zoomControl.translateTo]
    );

    React.useEffect(() => {
      const chartContainer = select(chartRef.current)
        .on("measure", (event: { detail: { width: number } }) => {
          const { width } = event.detail;

          timeScale.range([0, width]);
        })
        .on("draw", () => {
          // Use group draw event to ensure scales have their domain updated before
          // any of the elements are drawn (draw events are dispatched in document order).
        });

      chartContainer.call(zoomControl);

      if (chartContainer) {
        chartContainer.node()?.requestRedraw();
        chartContainer.call(zoomControl.transform, zoomIdentity);
      }
    }, [data, timeScale, timeScaleRescaled, zoomControl]);

    return (
      <d3fc-group ref={chartRef} class="d3fc-group" auto-resize>
        {scenegraph.panels.map((panel: Panel, i: number) => (
          <React.Fragment key={panel.id}>
            <div className="plot-area">
              <PlotArea
                scenegraph={panel}
                x={timeScaleRescaled}
                y={scalesRef.current![i]}
                crosshairXRef={crosshairXRef}
                index={i}
                crosshairYRef={crosshairsRef}
                requestRedraw={requestRedraw}
                onMouseMove={onMouseMove}
                onMouseOut={onMouseOut}
                onMouseOver={onMouseOver}
              />
            </div>
            {i < scenegraph.panels.length - 1 && (
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
