import "d3-transition";
import "@d3fc/d3fc-element";
import "./plot-container.scss";

import * as React from "react";

import { CandleDetailsExtended, Scenegraph } from "../types/element";
import { ScaleLinear, scaleLinear, scaleUtc } from "d3-scale";
import { ZoomTransform, zoom as d3Zoom, zoomIdentity } from "d3-zoom";

import { FcElement } from "../types/d3fc-types";
import { Interval } from "../api/vega-graphql";
import { PlotArea } from "./plot-area";
import { View } from "../types/vega-spec-types";
import { XAxis } from "./x-axis";
import { extent } from "d3-array";
import { getCandleWidth } from "../helpers";
import { parse } from "../scenegraph/parse";
import { select } from "d3-selection";

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
  (
    {
      width,
      height,
      data,
      view,
      interval,
      decimalPlaces,
      onBoundsChanged,
      onMouseMove,
      onMouseOut,
      onMouseOver,
      onRightClick,
      onGetDataRange,
    }: PlotContainerProps,
    ref: React.Ref<{ reset(): void }>
  ) => {
    React.useImperativeHandle(ref, () => ({
      reset: () => {
        reset();
      },
    }));

    const isPinnedRef = React.useRef(true);
    const previousZoomTransform = React.useRef(zoomIdentity);

    React.useLayoutEffect(() => {
      chartRef.current.requestRedraw();
    }, [height, width]);

    const chartRef = React.useRef<FcElement>(null!);

    const crosshairXRef = React.useRef<number | null>(null);

    const scalesRef = React.useRef<ScaleLinear<number, number, never>[]>(
      view.map(() => scaleLinear())
    );

    const crosshairsRef = React.useRef<(number | null)[]>(view.map(() => null));

    const candleWidth = getCandleWidth(interval);

    const scenegraph: Scenegraph = React.useMemo(
      () => parse(data, view, candleWidth, decimalPlaces),
      [candleWidth, data, decimalPlaces, view]
    );

    const x = React.useMemo(
      () =>
        scaleUtc().domain(
          extent(data, (d: CandleDetailsExtended) => d.date) as [Date, Date]
        ),
      [data]
    );

    const xr = React.useMemo(
      () =>
        scaleUtc().domain(
          extent(data, (d: CandleDetailsExtended) => d.date) as [Date, Date]
        ),
      [data]
    );

    const requestRedraw = React.useCallback(function reuqestRedraw() {
      select(chartRef.current).node()?.requestRedraw();
    }, []);

    const render = React.useCallback(
      function render(transform: ZoomTransform) {
        const k = transform.k / previousZoomTransform.current.k;
        const range = x.range().map(transform.invertX, transform);

        let diff = 0;

        if (k === 1) {
          isPinnedRef.current = false;
        } else {
          diff = isPinnedRef.current ? range[1] - x.range()[1] : 0;
        }

        const domain = [range[0] - diff, range[1] - diff].map(x.invert, x);

        xr.domain(domain);

        const filteredData = data.filter(
          (d) => d.date > domain[0] && d.date < domain[1]
        );

        // Update scale domains
        view.forEach((panel, i) => {
          const yEncodingFields = [];

          if (panel.layer) {
            panel.layer.forEach((layer) => {
              yEncodingFields.push(layer.encoding.y);

              if (layer.encoding.y2) {
                yEncodingFields.push(layer.encoding.y2.field);
              }
            });
          } else {
            yEncodingFields.push(panel.encoding.y.field);

            if (panel.encoding.y2) {
              yEncodingFields.push(panel.encoding.y2.field);
            }
          }

          const mappedData = yEncodingFields.flatMap(
            (field) =>
              (filteredData.map(
                (d) => d[field as keyof CandleDetailsExtended]
              ) as unknown) as number
          );

          const domain = extent(mappedData) as [number, number];
          const domainSize = Math.abs(domain[1] - domain[0]);

          scalesRef.current![i].domain([
            panel.encoding.y?.scale?.zero ? 0 : domain[0] - domainSize * 0.1,
            domain[1] + domainSize * 0.1,
          ]);
        });

        previousZoomTransform.current = transform;

        requestRedraw();
        onBoundsChanged?.(domain as [Date, Date]);
      },
      [data, onBoundsChanged, requestRedraw, view, x, xr]
    );

    const zoomControl = React.useMemo(() => {
      return d3Zoom<FcElement, unknown>()
        .scaleExtent([0, 1 << 4])
        .on("zoom", (event) => {
          render(event.transform);
        });
    }, [render]);

    const reset = React.useCallback(
      function reset() {
        select(chartRef.current)
          .transition()
          .duration(750)
          .call(zoomControl.translateTo, x.range()[1] + 50, 0, [
            x.range()[1],
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
      [x, zoomControl.translateTo]
    );

    React.useEffect(() => {
      const chartContainer = select(chartRef.current)
        .on("measure", (event: { detail: { width: number } }) => {
          const { width } = event.detail;

          x.range([0, width]);
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
    }, [data, x, xr, zoomControl]);

    return (
      <d3fc-group ref={chartRef} class="d3fc-group" auto-resize>
        {scenegraph.panels.map((panel, i) => (
          <React.Fragment key={panel.id}>
            <div className="plot-area">
              <PlotArea
                scenegraph={panel}
                x={xr}
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
          </React.Fragment>
        ))}
        <div className="separator"></div>
        <div className="x-axis">
          <XAxis
            scenegraph={scenegraph.xAxis}
            x={xr}
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
