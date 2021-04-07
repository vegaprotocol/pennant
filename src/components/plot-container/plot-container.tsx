import "d3-transition";
import "@d3fc/d3fc-element";
import "./plot-container.scss";

import * as React from "react";

import { ChartInterface, Panel, Scenegraph } from "../../types";
import { ScaleLinear, scaleLinear, scaleTime } from "d3-scale";
import { ZoomTransform, zoom as d3Zoom, zoomIdentity } from "d3-zoom";
import { asyncSnapshot, getCandleWidth, getSubMinutes } from "../../helpers";
import { drawChart, drawChartNoTransform } from "../../render";
import { select, selectAll } from "d3-selection";

import { FcElement } from "../../types";
import { Interval } from "../../stories/api/vega-graphql";
import { PlotArea } from "../plot-area";
import { TopLevelSpec } from "../../spec";
import { WIDTH } from "../../constants";
import { XAxis } from "../x-axis/x-axis";
import { extent } from "d3-array";
import { interpolateZoom } from "d3-interpolate";
import { throttle } from "lodash";

export type PlotContainerProps = {
  width: number;
  height: number;
  specification: TopLevelSpec;
  scenegraph: Scenegraph;
  interval: Interval;
  decimalPlaces: number;
  plotOverlay?: React.ReactNode;
  studyOverlay?: React.ReactNode;
  onBoundsChanged?: (bounds: [Date, Date]) => void;
  onMouseMove?: (index: number) => void;
  onMouseOut?: () => void;
  onMouseOver?: () => void;
  onRightClick?: (position: [number, number]) => void;
  onGetDataRange?: (from: string, to: string) => void;
};

export const PlotContainer = React.forwardRef(
  (
    {
      specification,
      scenegraph,
      interval,
      decimalPlaces,
      plotOverlay,
      studyOverlay,
      onBoundsChanged = () => {},
      onMouseMove,
      onMouseOut,
      onMouseOver,
      onGetDataRange = () => {},
    }: PlotContainerProps,
    ref: React.Ref<ChartInterface>
  ) => {
    React.useImperativeHandle(ref, () => ({
      fitBounds: (bounds: [Date, Date]) => {
        reset();
      },
      panBy: (n: number) => {
        panBy(n);
      },
      panTo: (x: Date) => {
        reset();
      },
      reset: () => {
        reset();
      },
      snapshot: () => {
        return snapshot();
      },
    }));

    // Everything is a ref because we are managing this state ourselves
    // This means we might make this a vanilla JavaScript object in the future
    const isFirstRun = React.useRef(true);
    const isPinnedRef = React.useRef(true);
    const previousZoomTransform = React.useRef(zoomIdentity);
    const timeScaleRef = React.useRef(scaleTime());
    const timeScaleRescaledRef = React.useRef(scaleTime()); // A rescaled copy of the time scale which reflects the user panning and scaling
    const chartRef = React.useRef<FcElement>(null!);
    const crosshairXRef = React.useRef<number | null>(null);
    const crosshairsRef = React.useRef<(number | null)[]>([null, null]);
    const scalesRef = React.useRef<ScaleLinear<number, number, never>[]>([
      scaleLinear(),
      scaleLinear(),
    ]);
    const zoomControl = React.useRef(d3Zoom<FcElement, unknown>());

    const data: any[] = React.useMemo(() => specification?.data?.values ?? [], [
      specification,
    ]);

    const domainRef = React.useRef(extent(data, (d) => d.date) as [Date, Date]);
    const candleWidth = getCandleWidth(interval);

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

    const requestRedraw = React.useCallback(function requestRedraw() {
      select(chartRef.current).node()?.requestRedraw();
    }, []);

    const reset = React.useCallback(
      function reset() {
        const latestData = data[data.length - 1].date;

        select(chartRef.current)
          .transition()
          .duration(750)
          .call(
            zoomControl.current.translateTo,
            timeScaleRef.current.range()[1],
            0,
            [timeScaleRef.current(latestData) - (WIDTH + 26), 0]
          )
          .end()
          .then(() => {
            isPinnedRef.current = true;
          })
          .catch((reason) =>
            console.warn(`Transition end promise failed: ${reason}`)
          );

        select(chartRef.current).node()?.requestRedraw();
      },
      [data]
    );

    React.useEffect(() => {
      const transform: ZoomTransform = zoomIdentity;

      const range = timeScaleRef.current
        .range()
        .map(transform.invertX, transform);

      const domain = range.map(
        timeScaleRef.current.invert,
        timeScaleRef.current
      );

      const domainWidth = domain[1].getTime() - domain[0].getTime();

      zoomControl.current
        // @ts-ignore
        .interpolate(interpolateZoom.rho(0))
        .scaleExtent([1 / (1 << 2), domainWidth / (candleWidth * 10)])
        .translateExtent([
          [0, 0],
          [0, 800],
        ])
        .constrain(function constrain(transform, extent, translateExtent) {
          const k = transform.k / previousZoomTransform.current.k;
          const x = transform.x - previousZoomTransform.current.x;

          let newTransform = transform;

          if (isPinnedRef.current && k === 1 && x !== 0) {
            isPinnedRef.current = false;
          } else if (isPinnedRef.current) {
            const gap =
              transform.invertX(extent[1][0] - (WIDTH + 26)) -
              (extent[1][0] - 0);

            newTransform = transform.translate(gap, 0);
          }

          if (x !== 0) {
            selectAll(".d3fc-canvas-layer.crosshair").classed("grabbing", true);
          }

          previousZoomTransform.current = transform;

          return newTransform;
        })
        .filter(function filter(event) {
          if (event.type == "dblclick") {
            reset();
            return false;
          }

          return !event.ctrlKey && !event.button;
        })
        .on("zoom", (event) => {
          drawChart(
            event,
            timeScaleRef.current,
            timeScaleRescaledRef.current,
            scenegraph,
            scalesRef,
            requestRedraw,
            onBoundsChangedThrottled
          );

          const transform: ZoomTransform = event.transform;
          const range = timeScaleRef.current
            .range()
            .map(transform.invertX, transform);
          const domain = range.map(
            timeScaleRef.current.invert,
            timeScaleRef.current
          );

          const domainWidth = domain[1].getTime() - domain[0].getTime();

          if (data[0].date.getTime() + domainWidth > domain[0].getTime()) {
            const to = data[0].date.toISOString();
            const from = new Date(
              data[0].date.getTime() - domainWidth
            ).toISOString();

            onGetDataRangeThrottled(from, to);
          }
        })
        .on("end", (event) => {
          selectAll(".d3fc-canvas-layer.crosshair").classed("grabbing", false);
        });
    }, [
      candleWidth,
      data,
      onBoundsChangedThrottled,
      onGetDataRangeThrottled,
      requestRedraw,
      reset,
      scenegraph,
    ]);

    const snapshot = React.useCallback(() => asyncSnapshot(chartRef), []);

    const panBy = React.useCallback(
      function panBy(n: number) {
        const ms = 1000 * 60 * getSubMinutes(interval, n);
        const offset = -(timeScaleRef.current(ms) - timeScaleRef.current(0));

        select(chartRef.current).call(
          zoomControl.current.translateBy,
          offset,
          0
        );
        select(chartRef.current).node()?.requestRedraw();
      },
      [interval]
    );

    React.useEffect(() => {
      const chartContainer = select(chartRef.current)
        .on(
          "measure",
          (event: { detail: { width: number; pixelRatio: number } }) => {
            const { width, pixelRatio } = event.detail;
            timeScaleRef.current.range([0, width / pixelRatio]);

            if (isFirstRun.current) {
              select(chartRef.current).call(
                zoomControl.current.transform,
                zoomIdentity.translate(
                  timeScaleRef.current(domainRef.current[1]) -
                    timeScaleRef.current.range()[1] -
                    WIDTH,
                  0
                )
              );

              isFirstRun.current = false;
            }
          }
        )
        .on("draw", () => {
          timeScaleRef.current.domain(domainRef.current);
        });

      chartContainer.call(zoomControl.current);
      chartContainer.node()?.requestRedraw();
    }, [zoomControl]);

    React.useEffect(() => {
      if (isPinnedRef.current) {
        const latestData = data[data.length - 1];

        if (latestData.date > domainRef.current[1]) {
          domainRef.current = [domainRef.current[0], latestData.date];
        }
      }
    }, [data]);

    React.useEffect(() => {
      timeScaleRef.current.domain(domainRef.current);
      select(chartRef.current).node()?.requestRedraw();
    }, []);

    drawChartNoTransform(
      timeScaleRescaledRef.current,
      scenegraph,
      scalesRef,
      requestRedraw,
      onBoundsChangedThrottled
    );

    return (
      <d3fc-group ref={chartRef} class="d3fc-group" auto-resize>
        <div className="plot-area">
          <PlotArea
            scenegraph={scenegraph.panels[0]}
            x={timeScaleRescaledRef.current}
            y={scalesRef.current![0]}
            crosshairXRef={crosshairXRef}
            index={0}
            crosshairYRef={crosshairsRef}
            overlay={plotOverlay}
            requestRedraw={requestRedraw}
            onMouseMove={onMouseMove}
            onMouseOut={onMouseOut}
            onMouseOver={onMouseOver}
          />
        </div>
        {scenegraph.panels.length === 2 && (
          <>
            <div className="separator">
              <div className="handle"></div>
            </div>
            <div className="plot-area">
              <PlotArea
                scenegraph={scenegraph.panels[1]}
                x={timeScaleRescaledRef.current}
                y={scalesRef.current![1]}
                crosshairXRef={crosshairXRef}
                index={1}
                crosshairYRef={crosshairsRef}
                overlay={studyOverlay}
                requestRedraw={requestRedraw}
                onMouseMove={onMouseMove}
                onMouseOut={onMouseOut}
                onMouseOver={onMouseOver}
              />
            </div>
          </>
        )}
        <div className="separator"></div>
        <div className="x-axis">
          <XAxis
            scenegraph={scenegraph.xAxis}
            x={timeScaleRescaledRef.current}
            y={scalesRef.current![0]}
            crosshairXRef={crosshairXRef}
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
