import "d3-transition";
import "@d3fc/d3fc-element";
import "./candlestick-chart.scss";

import * as React from "react";

import {
  BarElement,
  CandleElement,
  CrosshairElement,
  GridElement,
  XAxisElement,
  XAxisTooltipElement,
  YAxisElement,
  YAxisTooltipElement,
} from "../elements";
import { ZoomTransform, zoom as d3Zoom, zoomIdentity } from "d3-zoom";
import { bisector, extent, max, min } from "d3-array";
import { scaleLinear, scaleUtc } from "d3-scale";

import { Colors } from "../helpers/helpers-color";
import { FcElement } from "../types/d3fc-types";
import { Interval } from "../data/globalTypes";
import { clearCanvas } from "../helpers/helpers-canvas";
import { closestIndexTo } from "date-fns";
import { getCandleWidth } from "../helpers/helpers-candle";
import { select } from "d3-selection";

const PADDING_INNER = 0.4;

export interface CandleDetailsExtended {
  datetime: string;
  date: Date;
  high: number;
  low: number;
  open: number;
  close: number;
  volume: number;
}

export type CandleStickChartProps = {
  width: number;
  height: number;
  data: CandleDetailsExtended[];
  interval: Interval;
  onBoundsChanged?: (bounds: [Date, Date]) => void;
  onMouseMove?: (candle: CandleDetailsExtended) => void;
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
    const plotAreaRef = React.useRef<FcElement>(null!);
    const plotYAxisRef = React.useRef<FcElement>(null!);
    const plotCrosshairRef = React.useRef<FcElement>(null!);
    const studyAreaRef = React.useRef<FcElement>(null!);
    const studyYAxisRef = React.useRef<FcElement>(null!);
    const xAxisRef = React.useRef<FcElement>(null!);

    const crosshairXRef = React.useRef<number | null>(null);
    const plotCrosshairYRef = React.useRef<number | null>(null);
    const studyCrosshairYRef = React.useRef<number | null>(null);

    const candleWidth = getCandleWidth(interval);

    // Transform data to our intermediate representation. Think of it as a scenegraph
    // Everything is in domain space. This means this object should only change if the data changes
    // And ideally, we only need to update a small part of the object
    // Memoize obviously
    const scenegraph = React.useMemo(
      () => ({
        candles: data.map(
          (candle) =>
            new CandleElement({
              ...candle,
              x: candle.date,
              width: candleWidth * (1 - PADDING_INNER),
            })
        ),
        bars: data.map(
          (bar) =>
            new BarElement({
              ...bar,
              x: bar.date,
              height: bar.volume,
              width: candleWidth * (1 - PADDING_INNER),
            })
        ),
        grid: new GridElement(),
        plotYAxis: new YAxisElement(),
        plotCrosshair: new CrosshairElement(),
        plotYAxisTooltip: new YAxisTooltipElement(),
        studyYAxis: new YAxisElement(),
        studyCrosshair: new CrosshairElement(),
        studyYAxisTooltip: new YAxisTooltipElement(),
        xAxis: new XAxisElement(),
        xAxisTooltip: new XAxisTooltipElement(),
      }),
      [candleWidth, data]
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

    const y = React.useMemo(
      () =>
        scaleLinear().domain([
          min(data, (d: CandleDetailsExtended) => d.low),
          max(data, (d) => d.high),
        ] as [number, number]),
      [data]
    );

    const yr = React.useMemo(
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

        // Filter data by new domain
        const filteredData = data.filter(
          (d) => d.date > domain[0] && d.date < domain[1]
        );

        // Price scale
        const yDomain = [
          min(filteredData, (d: CandleDetailsExtended) => d.low),
          max(filteredData, (d: CandleDetailsExtended) => d.high),
        ] as [number, number];

        const yDomainSize = Math.abs(yDomain[1] - yDomain[0]);

        yr.domain([
          yDomain[0] - yDomainSize * 0.1,
          yDomain[1] + yDomainSize * 0.1,
        ]);

        // Volume scale
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

        select(chartRef.current).node()?.requestRedraw();

        onBoundsChanged?.(domain as [Date, Date]);
      },
      [data, onBoundsChanged, volumeScaleRescaled, x, xr, yr]
    );

    const zoomControl = React.useMemo(() => {
      return d3Zoom<HTMLElement, unknown>()
        .scaleExtent([0, 1 << 4])
        .on("zoom", (event) => {
          render(event.transform);
        });
    }, [render]);

    const reset = React.useCallback(
      function reset() {
        select<HTMLElement, unknown>(plotYAxisRef.current)
          .transition()
          .duration(750)
          .call(zoomControl.translateTo, x.range()[1], 0, [x.range()[1], 0])
          .end()
          .then(() => {
            isPinnedRef.current = true;
          })
          .catch((reason) => console.warn(reason));

        select(chartRef.current).node()?.requestRedraw();
      },
      [x, zoomControl.translateTo]
    );

    // Plot area
    React.useEffect(() => {
      select(plotAreaRef.current)
        .on(
          "measure",
          (event: { detail: { height: number; width: number } }) => {
            const { height, width } = event.detail;
            x.range([0, width]);
            y.range([height, 0]);
            xr.range([0, width]);
            yr.range([height, 0]);
          }
        )
        .on(
          "draw",
          (event: {
            detail: { child: HTMLCanvasElement; pixelRatio: number };
          }) => {
            const { child, pixelRatio } = event.detail;
            const ctx = child.getContext("2d");

            if (ctx) {
              ctx.save();
              ctx.scale(pixelRatio, pixelRatio);

              clearCanvas(child, ctx, Colors.BLACK);
              scenegraph.grid.draw(ctx, xr, yr);

              for (const candle of scenegraph.candles) {
                candle.draw(ctx, xr, yr);
              }

              ctx.restore();
            }
          }
        );
    }, [scenegraph.candles, scenegraph.grid, x, xr, y, yr, zoomControl]);

    // Plot y axis
    React.useEffect(() => {
      const container = select<HTMLElement, unknown>(plotYAxisRef.current)
        .on(
          "measure",
          (event: { detail: { height: number; width: number } }) => {
            const { height, width } = event.detail;
            xr.range([0, width]);
            yr.range([height, 0]);
          }
        )
        .on(
          "draw",
          (event: {
            detail: { child: HTMLCanvasElement; pixelRatio: number };
          }) => {
            const { child, pixelRatio } = event.detail;
            const ctx = child.getContext("2d");

            if (ctx) {
              ctx.save();
              ctx.scale(pixelRatio, pixelRatio);

              scenegraph.plotYAxis.draw(ctx, xr, yr);
              scenegraph.plotCrosshair.draw(ctx, xr, yr, [
                crosshairXRef.current,
                plotCrosshairYRef.current,
              ]);
              scenegraph.plotYAxisTooltip.draw(ctx, xr, yr, [
                crosshairXRef.current,
                plotCrosshairYRef.current,
              ]);

              ctx.restore();
            }
          }
        );

      container
        .on(
          "mousemove",
          (event: { offsetX: number; offsetY: number }) => {
            const { offsetX, offsetY } = event;
            const timeAtMouseX = xr.invert(offsetX);

            const index = bisector((d: CandleDetailsExtended) => d.date).left(
              data,
              timeAtMouseX
            );

            const firstCandle = data[index - 1];
            const secondCandle = data[index];

            let candle: CandleDetailsExtended;
            if (firstCandle && secondCandle) {
              // If we have two candles either side of mouse x find the one
              // closest to it
              const nearestCandleDates = [firstCandle.date, secondCandle.date];
              candle = [firstCandle, secondCandle][
                closestIndexTo(timeAtMouseX, nearestCandleDates)
              ];
            } else if (firstCandle) {
              candle = firstCandle;
            } else {
              candle = secondCandle;
            }

            crosshairXRef.current = xr(candle.date);
            plotCrosshairYRef.current = offsetY;

            xAxisRef.current.requestRedraw();
            plotYAxisRef.current.requestRedraw();
            studyYAxisRef.current.requestRedraw();

            onMouseMove?.(candle);
          },
          { capture: true } // TODO: It would be preferable to still respond to this event while zooming
        )
        .on("mouseout", () => {
          crosshairXRef.current = null;
          plotCrosshairYRef.current = null;

          xAxisRef.current.requestRedraw();
          plotYAxisRef.current.requestRedraw();
          studyYAxisRef.current.requestRedraw();

          onMouseOut?.();
        });

      container.call(zoomControl);
    }, [
      data,
      onMouseMove,
      onMouseOut,
      scenegraph.plotCrosshair,
      scenegraph.plotYAxis,
      scenegraph.plotYAxisTooltip,
      xr,
      yr,
      zoomControl,
    ]);

    // Study
    React.useEffect(() => {
      select(studyAreaRef.current)
        .on(
          "measure",
          (event: { detail: { height: number; width: number } }) => {
            const { height, width } = event.detail;
            xr.range([0, width]);
            volumeScaleRescaled.range([height, 0]);
          }
        )
        .on("draw", (_event) => {
          const canvas = select(studyAreaRef.current)
            ?.select("canvas")
            ?.node() as HTMLCanvasElement;

          const ctx: CanvasRenderingContext2D | null = canvas?.getContext("2d");

          if (ctx) {
            clearCanvas(canvas, ctx, Colors.BLACK);
            scenegraph.grid.draw(ctx, xr, volumeScaleRescaled);

            for (const bar of scenegraph.bars) {
              bar.draw(ctx, xr, volumeScaleRescaled);
            }
          }
        });
    }, [xr, volumeScaleRescaled, scenegraph.bars, scenegraph.grid]);

    // Study y axis
    React.useEffect(() => {
      const container = select<HTMLElement, unknown>(studyYAxisRef.current)
        .on(
          "measure",
          (event: { detail: { height: number; width: number } }) => {
            const { height, width } = event.detail;
            xr.range([0, width]);
            volumeScaleRescaled.range([height, 0]);
          }
        )
        .on(
          "draw",
          (event: {
            detail: { child: HTMLCanvasElement; pixelRatio: number };
          }) => {
            const { child, pixelRatio } = event.detail;
            const ctx = child.getContext("2d");

            if (ctx) {
              ctx.save();
              ctx.scale(pixelRatio, pixelRatio);

              scenegraph.studyYAxis.draw(ctx, xr, volumeScaleRescaled);
              scenegraph.studyCrosshair.draw(ctx, xr, yr, [
                crosshairXRef.current,
                studyCrosshairYRef.current,
              ]);
              scenegraph.studyYAxisTooltip.draw(ctx, xr, volumeScaleRescaled, [
                crosshairXRef.current,
                studyCrosshairYRef.current,
              ]);

              ctx.restore();
            }
          }
        );

      container.call(zoomControl);
    }, [
      xr,
      volumeScaleRescaled,
      zoomControl,
      scenegraph.studyYAxis,
      scenegraph.studyCrosshair,
      scenegraph.studyYAxisTooltip,
      yr,
    ]);

    // Study crosshair
    React.useEffect(() => {
      select(studyYAxisRef.current)
        .on(
          "mousemove",
          (event) => {
            const { offsetX, offsetY } = event;
            const timeAtMouseX = xr.invert(offsetX);

            const index = bisector((d: CandleDetailsExtended) => d.date).left(
              data,
              timeAtMouseX
            );

            const firstCandle = data[index - 1];
            const secondCandle = data[index];

            let candle: CandleDetailsExtended;
            if (firstCandle && secondCandle) {
              // If we have two candles either side of mouse x find the one
              // closest to it
              const nearestCandleDates = [firstCandle.date, secondCandle.date];
              candle = [firstCandle, secondCandle][
                closestIndexTo(timeAtMouseX, nearestCandleDates)
              ];
            } else if (firstCandle) {
              candle = firstCandle;
            } else {
              candle = secondCandle;
            }

            crosshairXRef.current = xr(candle.date);
            studyCrosshairYRef.current = offsetY;

            xAxisRef.current.requestRedraw();
            plotYAxisRef.current.requestRedraw();
            studyYAxisRef.current.requestRedraw();

            onMouseMove?.(candle);
          },
          { capture: true } // TODO: It would be preferable to still respond to this event while zooming
        )
        .on("mouseout", () => {
          crosshairXRef.current = null;
          studyCrosshairYRef.current = null;

          xAxisRef.current.requestRedraw();
          plotYAxisRef.current.requestRedraw();
          studyYAxisRef.current.requestRedraw();

          onMouseOut?.();
        });
    }, [
      data,
      onMouseMove,
      onMouseOut,
      scenegraph.plotCrosshair,
      x,
      xr,
      y,
      yr,
      zoomControl,
    ]);

    // X axis
    React.useEffect(() => {
      const container = select<HTMLElement, unknown>(xAxisRef.current).on(
        "draw",
        (event) => {
          const canvas = select(xAxisRef.current)
            ?.select("canvas")
            ?.node() as HTMLCanvasElement;

          const ctx: CanvasRenderingContext2D | null = canvas?.getContext("2d");

          if (ctx) {
            clearCanvas(canvas, ctx, Colors.BLACK);
            scenegraph.xAxis.draw(ctx, xr, y);
            scenegraph.xAxisTooltip.draw(ctx, xr, y, [
              crosshairXRef.current,
              null,
            ]);
          }
        }
      );

      container.call(zoomControl);
    }, [scenegraph.xAxis, scenegraph.xAxisTooltip, xr, y, zoomControl]);

    // Chart container
    React.useEffect(() => {
      const chartContainer = select(chartRef.current).on("draw", () => {
        // Use group draw event to ensure scales have their domain updated before
        // any of the elements are drawn (draw events are dispatched in document order).
      });

      if (chartContainer) {
        chartContainer.node()?.requestRedraw();
      }
    }, [data, x, y]);

    return (
      <d3fc-group
        ref={chartRef}
        class="d3fc-group"
        auto-resize
        use-device-pixel-ratio
      >
        <div className="plot-area">
          <d3fc-canvas
            ref={plotAreaRef}
            class="d3fc-canvas-layer"
          ></d3fc-canvas>
          <d3fc-canvas
            ref={plotCrosshairRef}
            class="d3fc-canvas-layer"
          ></d3fc-canvas>
          <d3fc-canvas
            ref={plotYAxisRef}
            class="d3fc-canvas-layer crosshair"
          ></d3fc-canvas>
        </div>
        <div className="separator"></div>
        <div className="study-area">
          <d3fc-canvas
            ref={studyAreaRef}
            class="d3fc-canvas-layer"
          ></d3fc-canvas>
          <d3fc-canvas
            ref={studyYAxisRef}
            class="d3fc-canvas-layer crosshair"
          ></d3fc-canvas>
        </div>
        <div className="x-axis">
          <d3fc-canvas ref={xAxisRef} class="time-axis"></d3fc-canvas>
        </div>
      </d3fc-group>
    );
  }
);
