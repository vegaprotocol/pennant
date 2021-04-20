import "d3-transition";
import "@d3fc/d3fc-element";
import "./plot-container.scss";

import * as React from "react";

import { ChartElement, Scenegraph } from "../../types";
import { scaleLinear, scaleTime } from "d3-scale";
import {
  ZoomTransform,
  zoom as d3Zoom,
  zoomIdentity,
  zoomTransform,
} from "d3-zoom";
import { asyncSnapshot, getCandleWidth, getSubMinutes } from "../../helpers";
import { drawChart, drawChartNoTransform } from "../../render";
import { select } from "d3-selection";

import { FcElement } from "../../types";
import { Interval } from "../../stories/api/vega-graphql";
import { PlotArea } from "../plot-area";
import { TopLevelSpec } from "../../vega-lite/spec";
import { WIDTH } from "../../constants";
import { XAxis } from "../x-axis/x-axis";
import { extent } from "d3-array";
import { interpolateZoom } from "d3-interpolate";
import { throttle } from "lodash";
import { calculateScales } from "../../scales";
import { useWhyDidYouUpdate } from "../../hooks/useWhyDidYouUpdate";

export type PlotContainerProps = {
  width: number;
  height: number;
  specification: TopLevelSpec;
  scenegraph: Scenegraph;
  interval: Interval;
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
  (props: PlotContainerProps, ref: React.Ref<ChartElement>) => {
    const {
      specification,
      scenegraph,
      interval,
      plotOverlay,
      studyOverlay,
      onBoundsChanged = () => {},
      onMouseMove,
      onMouseOut,
      onMouseOver,
      onGetDataRange = () => {},
    } = props;

    useWhyDidYouUpdate("PlotContainer", props);

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
    const isFreePan = React.useRef([false, false]);
    const isDragging = React.useRef(false);
    const plotRef = React.useRef<HTMLDivElement>(null!);
    const studyRef = React.useRef<HTMLDivElement>(null!);
    const chartRef = React.useRef<FcElement>(null!);
    const crosshairXRef = React.useRef<number | null>(null);
    const crosshairsRef = React.useRef<(number | null)[]>([null, null]);

    const plotZoom = React.useRef(d3Zoom<HTMLDivElement, any>());
    const previousPlotZoomTransform = React.useRef(zoomIdentity);
    const studyZoom = React.useRef(d3Zoom<HTMLDivElement, any>());
    const previousStudyZoomTransform = React.useRef(zoomIdentity);

    const timeScaleRef = React.useRef(scaleTime());
    const timeScaleRescaledRef = React.useRef(scaleTime()); // A rescaled copy of the time scale which reflects the user panning and scaling
    const plotScaleRef = React.useRef(scaleLinear());
    const plotScaleRescaledRef = React.useRef(scaleLinear());
    const studyScaleRef = React.useRef(scaleLinear());
    const studyScaleRescaledRef = React.useRef(scaleLinear());

    const data: any[] = React.useMemo(() => specification?.data?.values ?? [], [
      specification,
    ]);

    const timeDomainRef = React.useRef(
      extent(data, (d) => d.date) as [Date, Date]
    );

    const plotDomainRef = React.useRef(
      calculateScales(scenegraph.panels[0], data)
    );

    const studyDomainRef = React.useRef(
      calculateScales(scenegraph.panels[1], data)
    );

    const candleWidth = getCandleWidth(interval);
    const hasStudy = scenegraph.panels.length > 1;

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

        select(plotRef.current)
          .transition()
          .duration(750)
          .call(
            plotZoom.current.translateTo,
            timeScaleRef.current.range()[1],
            0,
            [
              timeScaleRef.current(latestData) - (WIDTH + 26),
              zoomTransform(plotRef.current).y,
            ]
          )
          .end()
          .then(() => {
            hasStudy &&
              select(studyRef.current)
                .datum("independent")
                .transition()
                .duration(250)
                .call(
                  studyZoom.current.translateTo,
                  timeScaleRef.current.range()[1],
                  0,
                  [timeScaleRef.current(latestData) - (WIDTH + 26), 0]
                )
                .end()
                .then(() => {
                  select(studyRef.current).datum(undefined);
                })
                .catch((reason) => {
                  select(studyRef.current).datum(undefined);
                  console.warn(`Transition end promise failed: ${reason}`);
                });

            select(plotRef.current)
              .datum("independent")
              .transition()
              .duration(250)
              .call(
                plotZoom.current.translateTo,
                timeScaleRef.current.range()[1],
                0,
                [timeScaleRef.current(latestData) - (WIDTH + 26), 0]
              )
              .end()
              .then(() => {
                select(plotRef.current).datum(undefined);
              })
              .catch((reason) => {
                select(plotRef.current).datum(undefined);
                console.warn(`Transition end promise failed: ${reason}`);
              });

            isPinnedRef.current = true;
          })
          .catch((reason) => {
            select(plotRef.current).datum(undefined);
            console.warn(`Transition end promise failed: ${reason}`);
          });

        select(chartRef.current).node()?.requestRedraw();
      },
      [data, hasStudy]
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

      plotZoom.current
        // @ts-ignore
        .interpolate(interpolateZoom.rho(0))
        .scaleExtent([1 / (1 << 2), domainWidth / (candleWidth * 10)])
        .translateExtent([
          [0, 0],
          [0, 800],
        ])
        .constrain(function constrain(transform, extent, translateExtent) {
          const k = transform.k / previousPlotZoomTransform.current.k;
          const x = transform.x - previousPlotZoomTransform.current.x;

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
            select(plotRef.current)
              .select(".d3fc-canvas-layer.crosshair")
              .classed("grabbing", true);
          }

          previousPlotZoomTransform.current = transform;

          return newTransform;
        })
        .filter(function filter(event) {
          if (event.type == "dblclick") {
            reset();
            return false;
          }

          return !event.ctrlKey && !event.button;
        })
        .on("zoom", (event, d) => {
          if (d === "sync") {
            return;
          }

          isDragging.current = true;

          if (hasStudy && d !== "independent") {
            select(studyRef.current)
              .datum("sync")
              .call(
                studyZoom.current.transform,
                zoomIdentity.translate(
                  event.transform.x,
                  zoomTransform(studyRef.current).y
                )
              )
              .datum(undefined);
          }

          drawChart(
            0,
            event,
            timeScaleRef.current,
            timeScaleRescaledRef.current,
            plotScaleRef.current,
            plotScaleRescaledRef.current,
            studyScaleRef.current,
            studyScaleRescaledRef.current,
            scenegraph,
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
        .on("end", () => {
          console.log("zoom ended");
          isDragging.current = false;

          select(plotRef.current)
            .select(".d3fc-canvas-layer.crosshair")
            .classed("grabbing", false);

          requestRedraw();
        });

      hasStudy &&
        studyZoom.current
          // @ts-ignore
          .interpolate(interpolateZoom.rho(0))
          .scaleExtent([1 / (1 << 2), domainWidth / (candleWidth * 10)])
          .translateExtent([
            [0, 0],
            [0, 800],
          ])
          .constrain(function constrain(transform, extent, translateExtent) {
            const k = transform.k / previousStudyZoomTransform.current.k;
            const x = transform.x - previousStudyZoomTransform.current.x;

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
              isDragging.current = true;

              select(studyRef.current)
                .select(".d3fc-canvas-layer.crosshair")
                .classed("grabbing", true);
            }

            previousStudyZoomTransform.current = transform;

            return newTransform;
          })
          .filter(function filter(event) {
            if (event.type == "dblclick") {
              reset();
              return false;
            }

            return !event.ctrlKey && !event.button;
          })
          .on("zoom", (event, d) => {
            if (d === "sync") {
              return;
            }

            if (d !== "independent") {
              select(plotRef.current)
                .datum("sync")
                .call(
                  plotZoom.current.transform,
                  zoomIdentity.translate(
                    event.transform.x,
                    zoomTransform(plotRef.current).y
                  )
                )
                .datum(undefined);
            }

            drawChart(
              1,
              event,
              timeScaleRef.current,
              timeScaleRescaledRef.current,
              plotScaleRef.current,
              plotScaleRescaledRef.current,
              studyScaleRef.current,
              studyScaleRescaledRef.current,
              scenegraph,
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
            //isDragging.current = false;

            select(studyRef.current)
              .select(".d3fc-canvas-layer.crosshair")
              .classed("grabbing", false);

            requestRedraw();
          });
    }, [
      candleWidth,
      data,
      hasStudy,
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

        //select(chartRef.current).call(timeZoom.current.translateBy, offset, 0);
        select(chartRef.current).node()?.requestRedraw();
      },
      [interval]
    );

    // On first run initialize zoom
    React.useEffect(() => {
      const chartContainer = select(chartRef.current)
        .on(
          "measure",
          (event: { detail: { width: number; pixelRatio: number } }) => {
            const { width, pixelRatio } = event.detail;
            timeScaleRef.current.range([0, width / pixelRatio]);

            if (isFirstRun.current) {
              select(plotRef.current).call(
                plotZoom.current.transform,
                zoomIdentity.translate(
                  timeScaleRef.current(timeDomainRef.current[1]) -
                    timeScaleRef.current.range()[1] -
                    WIDTH,
                  0
                )
              );

              hasStudy &&
                select(studyRef.current).call(
                  studyZoom.current.transform,
                  zoomIdentity.translate(
                    timeScaleRef.current(timeDomainRef.current[1]) -
                      timeScaleRef.current.range()[1] -
                      WIDTH,
                    0
                  )
                );

              plotScaleRescaledRef.current.domain(plotDomainRef.current);
              hasStudy &&
                studyScaleRescaledRef.current.domain(studyDomainRef.current);

              isFirstRun.current = false;
            }
          }
        )
        .on("draw", () => {
          timeScaleRef.current.domain(timeDomainRef.current);
          plotScaleRef.current.domain(plotDomainRef.current);
          studyScaleRef.current.domain(studyDomainRef.current);
        });

      select(plotRef.current).call(plotZoom.current);
      select(studyRef.current).call(studyZoom.current);

      chartContainer.node()?.requestRedraw();
    }, [hasStudy]);

    // If pinned include neweest data point in domain
    React.useEffect(() => {
      if (isPinnedRef.current) {
        const latestData = data[data.length - 1];

        if (latestData.date > timeDomainRef.current[1]) {
          timeDomainRef.current = [timeDomainRef.current[0], latestData.date];
        }
      }
    }, [data]);

    React.useEffect(() => {
      timeScaleRef.current.domain(timeDomainRef.current);
      plotScaleRef.current.domain(plotDomainRef.current);
      studyScaleRef.current.domain(studyDomainRef.current);

      select(chartRef.current).node()?.requestRedraw();
    }, []);

    drawChartNoTransform(
      timeScaleRescaledRef.current,
      scenegraph,
      requestRedraw,
      onBoundsChangedThrottled
    );

    return (
      <d3fc-group ref={chartRef} class="d3fc-group" auto-resize>
        <div ref={plotRef} className="plot-area">
          <PlotArea
            scenegraph={scenegraph.panels[0]}
            x={timeScaleRescaledRef.current}
            y={plotScaleRescaledRef.current}
            yOriginal={plotScaleRef.current}
            crosshairXRef={crosshairXRef}
            crosshairYRef={crosshairsRef}
            index={0}
            isDragging={isDragging}
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
            <div ref={studyRef} className="plot-area">
              <PlotArea
                scenegraph={scenegraph.panels[1]}
                x={timeScaleRescaledRef.current}
                y={studyScaleRescaledRef.current}
                yOriginal={studyScaleRef.current}
                crosshairXRef={crosshairXRef}
                crosshairYRef={crosshairsRef}
                index={1}
                isDragging={isDragging}
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
            y={plotScaleRescaledRef.current}
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
