import "d3-transition";
import "@d3fc/d3fc-element";

import * as React from "react";

import { ZoomTransform, zoom as d3Zoom, zoomIdentity } from "d3-zoom";
import { bisector, extent, max, min } from "d3-array";
import { scaleLinear, scaleUtc } from "d3-scale";

import { BarElement } from "./element-bar";
import { CandleElement } from "./element-candle";
import { Colors } from "../lib/vega-colours";
import { CrosshairElement } from "./element-crosshair";
import { GridElement } from "./element-grid";
import { Interval } from "../data/globalTypes";
import { XAxisElement } from "./element-x-axis";
import { XAxisTooltipElement } from "./element-x-axis-tooltip";
import { YAxisElement } from "./element-y-axis";
import { YAxisTooltipElement } from "./element-y-axis-tooltip";
import { clearCanvas } from "./helpers";
import { closestIndexTo } from "date-fns";
import { getCandleWidth } from "../lib/get-candle-width";
import { select } from "d3-selection";
import { throttle } from "lodash";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "d3fc-group": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
      "d3fc-canvas": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

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
      (chartRef.current as any).requestRedraw();
    }, [height, width]);

    const chartRef = React.useRef<HTMLElement>(null!);
    const plotAreaRef = React.useRef<HTMLElement>(null!);
    const plotYAxisRef = React.useRef<HTMLElement>(null!);
    const plotCrosshairRef = React.useRef<HTMLElement>(null!);
    const studyAreaRef = React.useRef<HTMLElement>(null!);
    const studyYAxisRef = React.useRef<HTMLElement>(null!);
    const xAxisRef = React.useRef<HTMLElement>(null!);

    const crosshairXRef = React.useRef<number | null>(null);
    const plotCrosshairYRef = React.useRef<number | null>(null);
    const studyCrosshairYRef = React.useRef<number | null>(null);

    const throttledOnGetDataRange = React.useMemo(
      () => throttle(onGetDataRange, 5000),
      [onGetDataRange]
    );

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

    const zoomControl = React.useMemo(() => {
      return d3Zoom<HTMLElement, unknown>()
        .scaleExtent([0, 1 << 4])
        .on("zoom", (event) => {
          render(event.transform);
        });
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

        (select(chartRef.current).node() as any).requestRedraw();

        onBoundsChanged?.(domain as [Date, Date]);
      },
      [data, onBoundsChanged, volumeScaleRescaled, x, xr, yr]
    );

    const reset = React.useCallback(
      function reset() {
        select(plotYAxisRef.current)
          .transition()
          .duration(750)
          .call(zoomControl.translateTo, x.range()[1], 0, [x.range()[1], 0])
          .end()
          .then(() => {
            isPinnedRef.current = true;
          })
          .catch((reason) => console.warn(reason));

        (select(chartRef.current).node() as any).requestRedraw();
      },
      [x, zoomControl.translateTo]
    );

    // Plot area
    React.useEffect(() => {
      select(plotAreaRef.current)
        .on("measure", (event: any) => {
          const { height, width } = event.detail;
          x.range([0, width]);
          y.range([height, 0]);
          xr.range([0, width]);
          yr.range([height, 0]);
        })
        .on("draw", (event) => {
          const { child, pixelRatio } = event.detail;
          const ctx = child.getContext("2d");

          ctx.save();
          ctx.scale(pixelRatio, pixelRatio);

          if (ctx) {
            clearCanvas(child, ctx, Colors.BLACK);
            scenegraph.grid.draw(ctx, xr, yr);

            for (const candle of scenegraph.candles) {
              candle.draw(ctx, xr, yr);
            }
          }

          ctx.restore();
        });
    }, [scenegraph.candles, scenegraph.grid, x, xr, y, yr, zoomControl]);

    // Plot y axis
    React.useEffect(() => {
      const container = select(plotYAxisRef.current)
        .on("measure", (event: any) => {
          const { height, width } = event.detail;
          xr.range([0, width]);
          yr.range([height, 0]);
        })
        .on("draw", (event) => {
          const { child, pixelRatio } = event.detail;
          const ctx = child.getContext("2d");

          ctx.save();
          ctx.scale(pixelRatio, pixelRatio);

          if (ctx) {
            scenegraph.plotYAxis.draw(ctx, xr, yr);
            scenegraph.plotCrosshair.draw(ctx, xr, yr, [
              crosshairXRef.current,
              plotCrosshairYRef.current,
            ]);
            scenegraph.plotYAxisTooltip.draw(ctx, xr, yr, [
              crosshairXRef.current,
              plotCrosshairYRef.current,
            ]);
          }

          ctx.restore();
        });

      container
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
            plotCrosshairYRef.current = offsetY;

            (xAxisRef.current as any).requestRedraw();
            (plotYAxisRef.current as any).requestRedraw();
            (studyYAxisRef.current as any).requestRedraw();

            onMouseMove?.(candle);
          },
          { capture: true } // TODO: It would be preferable to still respond to this event while zooming
        )
        .on("mouseout", () => {
          crosshairXRef.current = null;
          plotCrosshairYRef.current = null;

          (xAxisRef.current as any).requestRedraw();
          (plotYAxisRef.current as any).requestRedraw();
          (studyYAxisRef.current as any).requestRedraw();

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
        .on("measure", (event: any) => {
          const { height, width } = event.detail;
          xr.range([0, width]);
          volumeScaleRescaled.range([height, 0]);
        })
        .on("draw", (event) => {
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
      const container = select(studyYAxisRef.current)
        .on("measure", (event: any) => {
          const { height, width } = event.detail;
          xr.range([0, width]);
          volumeScaleRescaled.range([height, 0]);
        })
        .on("draw", (event) => {
          const { child, pixelRatio } = event.detail;
          const ctx = child.getContext("2d");

          ctx.save();
          ctx.scale(pixelRatio, pixelRatio);

          if (ctx) {
            scenegraph.studyYAxis.draw(ctx, xr, volumeScaleRescaled);
            scenegraph.studyCrosshair.draw(ctx, xr, yr, [
              crosshairXRef.current,
              studyCrosshairYRef.current,
            ]);
            scenegraph.studyYAxisTooltip.draw(ctx, xr, volumeScaleRescaled, [
              crosshairXRef.current,
              studyCrosshairYRef.current,
            ]);
          }

          ctx.restore();
        });

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

            (xAxisRef.current as any).requestRedraw();
            (plotYAxisRef.current as any).requestRedraw();
            (studyYAxisRef.current as any).requestRedraw();

            onMouseMove?.(candle);
          },
          { capture: true } // TODO: It would be preferable to still respond to this event while zooming
        )
        .on("mouseout", () => {
          crosshairXRef.current = null;
          studyCrosshairYRef.current = null;

          (xAxisRef.current as any).requestRedraw();
          (plotYAxisRef.current as any).requestRedraw();
          (studyYAxisRef.current as any).requestRedraw();

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
      const container = select(xAxisRef.current).on("draw", (event) => {
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
      });

      container.call(zoomControl);
    }, [scenegraph.xAxis, scenegraph.xAxisTooltip, xr, y, zoomControl]);

    // Chart container
    React.useEffect(() => {
      const chartContainer = select(chartRef.current).on("draw", () => {
        // Use group draw event to ensure scales have their domain updated before
        // any of the elements are drawn (draw events are dispatched in document order).
      });

      (chartContainer?.node() as any).requestRedraw();
    }, [data, x, y]);

    return (
      <d3fc-group
        ref={chartRef}
        auto-resize
        use-device-pixel-ratio
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gridTemplateRows: "2fr 1px 1fr auto",
          gridTemplateAreas: `"plot-area" "separator" "study-area" "x-axis"`,
          gap: "0",
          width: "100%",
          height: "100%",
        }}
      >
        <div
          style={{
            gridArea: "plot-area",
            position: "relative",
          }}
        >
          <d3fc-canvas
            ref={plotAreaRef}
            style={{ position: "absolute", width: "100%", height: "100%" }}
          ></d3fc-canvas>
          <d3fc-canvas
            ref={plotCrosshairRef}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
            }}
          ></d3fc-canvas>
          <d3fc-canvas
            ref={plotYAxisRef}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              cursor: "crosshair",
            }}
          ></d3fc-canvas>
        </div>
        <div
          style={{ gridArea: "separator", backgroundColor: Colors.GRAY_LIGHT }}
        ></div>
        <div
          style={{
            gridArea: "study-area",
            position: "relative",
          }}
        >
          <d3fc-canvas
            ref={studyAreaRef}
            style={{ position: "absolute", width: "100%", height: "100%" }}
          ></d3fc-canvas>
          <d3fc-canvas
            ref={studyYAxisRef}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              cursor: "crosshair",
            }}
          ></d3fc-canvas>
        </div>
        <div style={{ gridArea: "x-axis", position: "relative" }}>
          <d3fc-canvas
            ref={xAxisRef}
            style={{ width: "100%", height: "26px" }}
          ></d3fc-canvas>
        </div>
      </d3fc-group>
    );
  }
);
