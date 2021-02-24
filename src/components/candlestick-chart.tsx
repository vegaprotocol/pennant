import "d3-transition";
import "@d3fc/d3fc-element";
import "./candlestick-chart.scss";

import * as React from "react";

import {
  AnnotationElement,
  BarElement,
  CandleElement,
  CrosshairElement,
  GridElement,
  XAxisElement,
  XAxisTooltipElement,
  YAxisElement,
  YAxisTooltipElement,
} from "../elements";
import { CandleDetailsExtended, Scenegraph } from "../types/element";
import { ZoomTransform, zoom as d3Zoom, zoomIdentity } from "d3-zoom";
import { extent, max, min } from "d3-array";
import { scaleLinear, scaleUtc } from "d3-scale";

import { FcElement } from "../types/d3fc-types";
import { Interval } from "../api/vega-graphql";
import { PlotArea } from "./plot-area";
import { XAxis } from "./x-axis";
import { getCandleWidth } from "../helpers";
import { select } from "d3-selection";

const PADDING_INNER = 0.4;

export type CandleStickChartProps = {
  width: number;
  height: number;
  data: CandleDetailsExtended[];
  interval: Interval;
  decimalPlaces: number;
  onBoundsChanged?: (bounds: [Date, Date]) => void;
  onMouseMove?: (index: number) => void;
  onMouseOut?: () => void;
  onMouseOver?: () => void;
  onRightClick?: (position: [number, number]) => void;
  onGetDataRange: (from: string, to: string) => void;
};

export const CandlestickChart = React.forwardRef(
  (
    {
      width,
      height,
      data,
      interval,
      decimalPlaces,
      onBoundsChanged,
      onMouseMove,
      onMouseOut,
      onMouseOver,
      onRightClick,
      onGetDataRange,
    }: CandleStickChartProps,
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
    const plotCrosshairYRef = React.useRef<number | null>(null);
    const studyCrosshairYRef = React.useRef<number | null>(null);

    const candleWidth = getCandleWidth(interval);
    const lastPrice = data.length > 0 ? data[data.length - 1].close : null;

    const scenegraph: Scenegraph = React.useMemo(
      () => ({
        plot: {
          data: data.map(
            (candle) =>
              new CandleElement({
                ...candle,
                x: candle.date,
                width: candleWidth * (1 - PADDING_INNER),
              })
          ),
          grid: new GridElement(),
          axis: new YAxisElement(),
          crosshair: new CrosshairElement(),
          axisTooltip: new YAxisTooltipElement(decimalPlaces),
          annotations: [new AnnotationElement(decimalPlaces, lastPrice)],
        },
        study: {
          data: data.map(
            (bar) =>
              new BarElement({
                ...bar,
                x: bar.date,
                height: bar.volume,
                width: candleWidth * (1 - PADDING_INNER),
              })
          ),
          grid: new GridElement(),
          axis: new YAxisElement(),
          crosshair: new CrosshairElement(),
          axisTooltip: new YAxisTooltipElement(decimalPlaces),
          annotations: [],
        },
        xAxis: {
          data: data.map(
            (candle) =>
              new CandleElement({
                ...candle,
                x: candle.date,
                width: candleWidth * (1 - PADDING_INNER),
              })
          ),
          axis: new XAxisElement(),
          axisTooltip: new XAxisTooltipElement(),
        },
      }),
      [candleWidth, data, decimalPlaces, lastPrice]
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

    const priceScaleRescaled = React.useMemo(
      () =>
        scaleLinear().domain([
          min(data, (d: CandleDetailsExtended) => d.low),
          max(data, (d) => d.high),
        ] as [number, number]),
      [data]
    );

    const volumeScaleRescaled = React.useMemo(
      () =>
        scaleLinear().domain(
          extent(data, (d: CandleDetailsExtended) => d.volume) as [
            number,
            number
          ]
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

        const yDomain = [
          min(filteredData, (d: CandleDetailsExtended) => d.low),
          max(filteredData, (d: CandleDetailsExtended) => d.high),
        ] as [number, number];

        const yDomainSize = Math.abs(yDomain[1] - yDomain[0]);

        priceScaleRescaled.domain([
          yDomain[0] - yDomainSize * 0.1,
          yDomain[1] + yDomainSize * 0.1,
        ]);

        const volumeDomain = [
          Math.min(
            0,
            min(filteredData, (d: CandleDetailsExtended) => d.volume) as number
          ),
          max(filteredData, (d: CandleDetailsExtended) => d.volume),
        ] as [number, number];

        const volumeDomainSize = Math.abs(volumeDomain[1] - volumeDomain[0]);

        volumeScaleRescaled.domain([
          volumeDomain[0],
          volumeDomain[1] + volumeDomainSize * 0.1,
        ]);

        previousZoomTransform.current = transform;

        requestRedraw();

        onBoundsChanged?.(domain as [Date, Date]);
      },
      [
        x,
        xr,
        data,
        priceScaleRescaled,
        volumeScaleRescaled,
        requestRedraw,
        onBoundsChanged,
      ]
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
          x.domain(
            extent(data, (d: CandleDetailsExtended) => d.date) as [Date, Date]
          );
        });

      chartContainer.call(zoomControl);

      if (chartContainer) {
        chartContainer.node()?.requestRedraw();
      }
    }, [data, x, zoomControl]);

    return (
      <d3fc-group ref={chartRef} class="d3fc-group" auto-resize>
        <div className="plot-area">
          <PlotArea
            scenegraph={scenegraph.plot}
            x={xr}
            y={priceScaleRescaled}
            crosshairXRef={crosshairXRef}
            crosshairYRef={plotCrosshairYRef}
            requestRedraw={requestRedraw}
            onMouseMove={onMouseMove}
            onMouseOut={onMouseOut}
          />
        </div>
        <div className="separator-1"></div>
        <div className="study-area">
          <PlotArea
            scenegraph={scenegraph.study}
            x={xr}
            y={volumeScaleRescaled}
            crosshairXRef={crosshairXRef}
            crosshairYRef={studyCrosshairYRef}
            requestRedraw={requestRedraw}
            onMouseMove={onMouseMove}
            onMouseOut={onMouseOut}
          />
        </div>
        <div className="separator-2"></div>
        <div className="x-axis">
          <XAxis
            scenegraph={scenegraph.xAxis}
            x={xr}
            y={priceScaleRescaled}
            crosshairXRef={crosshairXRef}
            crosshairYRef={studyCrosshairYRef}
            requestRedraw={requestRedraw}
            onMouseMove={onMouseMove}
            onMouseOut={onMouseOut}
          />
        </div>
      </d3fc-group>
    );
  }
);
