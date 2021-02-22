import "d3-transition";
import "@d3fc/d3fc-element";

import * as React from "react";

import { ZoomTransform, zoom as d3Zoom, zoomIdentity } from "d3-zoom";
import { bisector, extent, max, min } from "d3-array";
import { closestIndexTo, format } from "date-fns";
import { scaleLinear, scaleUtc } from "d3-scale";

// TODO: Rename element to shape
import { BarElement } from "./element-bar";
import { CandleElement } from "./element-candle";
import { Colors } from "../lib/vega-colours";
import { Interval } from "../data/globalTypes";
import { clearCanvas } from "./helpers";
import { parseInterval } from "../lib/interval";
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

const minutesToMS = (mins: number): number => mins * 60 * 1000;
const hoursToMS = (hours: number): number => hours * 60 * 60 * 1000;
const daysToMS = (days: number): number => days * 24 * 60 * 60 * 1000;

const getCandleWidth = (interval: Interval) => {
  const [intervalValue, intervalUnit] = parseInterval(interval);

  let ms: number;

  switch (intervalUnit) {
    case "M":
      ms = minutesToMS(intervalValue);
      break;
    case "H":
      ms = hoursToMS(intervalValue);
      break;
    case "D":
      ms = daysToMS(intervalValue);
      break;
    default:
      throw new Error("Invalid interval unit");
  }

  return ms;
};

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

function drawCrosshair(
  ctx: CanvasRenderingContext2D,
  xScale: any,
  yScale: any,
  x: any,
  y: any
) {
  const xRange = xScale.range().map(Math.round);
  const yRange = yScale.range().map(Math.round);

  ctx.save();

  // Lines
  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = Colors.GRAY_LIGHT;
  ctx.beginPath();
  ctx.moveTo(Math.round(x) + 0.5, yRange[0]);
  ctx.lineTo(Math.round(x) + 0.5, yRange[1]);
  ctx.stroke();
  ctx.closePath();

  ctx.beginPath();
  ctx.moveTo(xRange[0], Math.round(y) + 0.5);
  ctx.lineTo(xRange[1], Math.round(y) + 0.5);
  ctx.stroke();
  ctx.closePath();

  ctx.restore();
}

function drawGrid(ctx: CanvasRenderingContext2D, xScale: any, yScale: any) {
  const xRange = xScale.range().map(Math.round);
  const yRange = yScale.range().map(Math.round);

  const numXTicks = (xRange[1] - xRange[0]) / 50;
  const numYTicks = Math.abs(yRange[1] - yRange[0]) / 50;

  const xTicks = xScale.ticks(numXTicks);
  const yTicks = yScale.ticks(numYTicks);

  for (const tick of xTicks) {
    ctx.save();
    ctx.beginPath();

    ctx.strokeStyle = "#484848";
    ctx.fillStyle = "transparent";
    ctx.lineWidth = 0.7;

    ctx.moveTo(Math.round(xScale(tick)), yRange[0]);
    ctx.lineTo(Math.round(xScale(tick)), yRange[1]);

    ctx.fill();
    ctx.stroke();

    ctx.closePath();
    ctx.restore();
  }

  for (const tick of yTicks) {
    ctx.save();
    ctx.beginPath();

    ctx.strokeStyle = "#484848";
    ctx.fillStyle = "transparent";
    ctx.lineWidth = 1;

    ctx.moveTo(xRange[0], Math.round(yScale(tick)) + 0.5);
    ctx.lineTo(xRange[1], Math.round(yScale(tick)) + 0.5);

    ctx.fill();
    ctx.stroke();

    ctx.closePath();
    ctx.restore();
  }
}

function drawXAxis(ctx: CanvasRenderingContext2D, xScale: any) {
  ctx.strokeStyle = "#fff";

  const tickFormat = xScale.tickFormat();

  const xRange = xScale.range();
  const numXTicks = (xRange[1] - xRange[0]) / 60;
  const xTicks = xScale.ticks(numXTicks);

  xTicks.forEach((tick: number) => {
    ctx.beginPath();
    ctx.fillStyle = Colors.GRAY_LIGHT;
    ctx.textBaseline = "top";
    ctx.textAlign = "center";
    ctx.font = `12px monospace`;
    ctx.fillText(tickFormat(tick), xScale(tick), 9);
    ctx.closePath();
  });
}

function drawXAxisTooltip(
  ctx: CanvasRenderingContext2D,
  xScale: any,
  yScale: any,
  position: [number, number] | null
) {
  if (position) {
    const height = 24.5;
    const x = position[0];

    ctx.font = `12px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const value = xScale.invert(x);
    const xPad = 5;
    const text = format(value, "HH:mm");
    const textWidth = ctx.measureText(text).width;
    const rectWidth = textWidth + xPad * 2;
    const rectHeight = 19;

    let xAdjusted = x;

    if (x - rectWidth / 2 < 0) {
      xAdjusted = rectWidth / 2;
    }

    if (x + rectWidth / 2 > xScale.range()[1]) {
      xAdjusted = xScale.range()[1] - rectWidth / 2;
    }

    ctx.beginPath();
    ctx.moveTo(xAdjusted, height - rectHeight - 5);
    ctx.lineTo(xAdjusted + 5, height - rectHeight);
    ctx.lineTo(xAdjusted + rectWidth / 2, height - rectHeight);
    ctx.lineTo(xAdjusted + rectWidth / 2, height);
    ctx.lineTo(xAdjusted - rectWidth / 2, height);
    ctx.lineTo(xAdjusted - rectWidth / 2, height - rectHeight);
    ctx.lineTo(xAdjusted - 5, height - rectHeight);
    ctx.closePath();

    ctx.fillStyle = Colors.GRAY_DARK_1;
    ctx.strokeStyle = Colors.GRAY_LIGHT_1;
    ctx.fill();
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    ctx.fillStyle = Colors.WHITE;
    ctx.fillText(text, xAdjusted, height - rectHeight / 2);
    ctx.closePath();
  }
}

function drawYAxis(ctx: CanvasRenderingContext2D, xScale: any, yScale: any) {
  ctx.strokeStyle = "#fff";

  const yRange = yScale.range();
  const numYTicks = Math.abs(yRange[1] - yRange[0]) / 60;
  const yTicks = yScale.ticks(numYTicks);

  yTicks.forEach((tick: number) => {
    const text = tick.toString();
    const textWidth = ctx.measureText(text).width;

    ctx.beginPath();
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(
      xScale.range()[1] - textWidth - 10,
      yScale(tick) - 10,
      textWidth + 10,
      20
    );
    ctx.closePath();

    ctx.beginPath();
    ctx.fillStyle = Colors.GRAY_LIGHT;
    ctx.textBaseline = "middle";
    ctx.textAlign = "right";
    ctx.font = `12px monospace`;
    ctx.fillText(
      String(Math.round(tick)),
      xScale.range()[1] - 5,
      Math.round(yScale(tick))
    );
    ctx.closePath();
  });
}

function drawYAxisTooltip(
  ctx: CanvasRenderingContext2D,
  xScale: any,
  yScale: any,
  position: [number, number] | null,
  decimalPlaces = 5
) {
  if (position) {
    const width = xScale.range()[1];
    const y = position[1] + 0.5;

    ctx.font = `12px monospace`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    const value = yScale.invert(y);
    const xPad = 5;
    const text = value.toFixed(decimalPlaces);
    const textWidth = ctx.measureText(text).width;
    const rectWidth = textWidth + xPad;
    const rectHeight = 18;

    let yAdjusted = y;

    if (y - rectHeight / 2 < 0) {
      yAdjusted = rectHeight / 2;
    }

    if (y + rectHeight / 2 > yScale.range()[0]) {
      yAdjusted = yScale.range()[0] - rectHeight / 2;
    }

    ctx.beginPath();
    ctx.moveTo(width - rectWidth - 10, yAdjusted);
    ctx.lineTo(width - rectWidth, yAdjusted - rectHeight / 2);
    ctx.lineTo(width, yAdjusted - rectHeight / 2);
    ctx.lineTo(width, yAdjusted + rectHeight / 2);
    ctx.lineTo(width - rectWidth, yAdjusted + rectHeight / 2);
    ctx.closePath();

    ctx.fillStyle = Colors.GRAY_DARK_1;
    ctx.strokeStyle = "white";
    ctx.fill();
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    ctx.fillStyle = Colors.WHITE;
    ctx.fillText(text, width - xPad, yAdjusted);
    ctx.closePath();
  }
}

export type CandleStickChartProps = {
  width: number;
  height: number;
  data: CandleDetailsExtended[];
  interval: Interval;
  onBoundsChanged?: (bounds: [Date, Date]) => void;
  onMouseMove?: (position: [number, number]) => void;
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

    const zoomControl = React.useMemo(
      () =>
        d3Zoom<HTMLElement, unknown>()
          .scaleExtent([0, 1 << 4])
          .on("zoom", (event) => {
            render(event.transform);
          }),
      []
    );

    const chartRef = React.useRef<HTMLElement>(null!);
    const plotAreaRef = React.useRef<HTMLElement>(null!);
    const plotYAxisRef = React.useRef<HTMLElement>(null!);
    const plotCrosshairRef = React.useRef<HTMLElement>(null!);
    const studyAreaRef = React.useRef<HTMLElement>(null!);
    const studyYAxisRef = React.useRef<HTMLElement>(null!);
    const xAxisRef = React.useRef<HTMLCanvasElement>(null!);

    const crosshairRef = React.useRef<[number, number] | null>(null);

    const throttledOnGetDataRange = React.useMemo(
      () => throttle(onGetDataRange, 5000),
      [onGetDataRange]
    );

    const candleWidth = getCandleWidth(interval);

    // Transform data to our intermediate representation. Think of it as a scenegraph
    // Everything is in domain space. This means this object should only change if the data changes
    // And ideally, we only need to update a small part of the object
    // Memoize obviously
    const candles = data.map(
      (candle) =>
        new CandleElement({
          ...candle,
          x: candle.date,
          width: candleWidth * (1 - PADDING_INNER),
        })
    );

    const bars = data.map(
      (bar) =>
        new BarElement({
          ...bar,
          x: bar.date,
          height: bar.volume,
          width: candleWidth * (1 - PADDING_INNER),
        })
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

    const volumeScale = React.useMemo(
      () =>
        scaleLinear().domain(
          extent(data, (d: CandleDetailsExtended) => d.volume) as [
            number,
            number
          ]
        ),
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

        (select(chartRef.current).node() as any).requestRedraw();

        onBoundsChanged?.(domain as [Date, Date]);
      },
      [data, onBoundsChanged, volumeScaleRescaled, x, xr, yr]
    );

    const reset = React.useCallback(
      function reset() {
        console.log(x.domain());
        select(plotYAxisRef.current)
          .transition()
          .duration(200)
          .call(zoomControl.translateTo, x.range()[1], 0, [x.range()[1], 0]);

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
            drawGrid(ctx, xr, yr);

            for (const candle of candles) {
              candle.draw(ctx, xr, yr);
            }
          }

          ctx.restore();
        });
    }, [candles, x, xr, y, yr, zoomControl]);

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
            drawYAxis(ctx, xr, yr);
            drawYAxisTooltip(ctx, xr, yr, crosshairRef.current);
          }

          ctx.restore();
        });

      container.call(zoomControl);
    }, [xr, yr, zoomControl]);

    // Plot crosshair
    React.useEffect(() => {
      select(plotYAxisRef.current)
        .on(
          "mousemove",
          (event) => {
            console.log("moving");
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

            const canvas = select(plotYAxisRef.current)
              ?.select("canvas")
              ?.node() as HTMLCanvasElement;

            const ctx = canvas.getContext("2d");

            crosshairRef.current = [xr(candle.date), offsetY];

            if (ctx) {
              clearCanvas(canvas, ctx, "#fff");
              drawCrosshair(ctx, xr, yr, xr(candle.date), offsetY);
            }

            (xAxisRef.current as any).requestRedraw();
            (plotYAxisRef.current as any).requestRedraw();

            onMouseMove?.([offsetX, offsetY]);
          },
          { capture: true }
        )
        .on("mouseout", () => {
          crosshairRef.current = null;
        });
    }, [data, onMouseMove, x, xr, y, yr, zoomControl]);

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
            drawGrid(ctx, xr, volumeScaleRescaled);

            for (const bar of bars) {
              bar.draw(ctx, xr, volumeScaleRescaled);
            }
          }
        });
    }, [bars, xr, volumeScaleRescaled]);

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
            drawYAxis(ctx, xr, volumeScaleRescaled);
          }

          ctx.restore();
        });

      container.call(zoomControl);
    }, [xr, volumeScaleRescaled, zoomControl]);

    // X axis
    React.useEffect(() => {
      select(xAxisRef.current).on("draw", (event) => {
        const canvas = select(xAxisRef.current)
          ?.select("canvas")
          ?.node() as HTMLCanvasElement;

        const ctx: CanvasRenderingContext2D | null = canvas?.getContext("2d");

        if (ctx) {
          clearCanvas(canvas, ctx, Colors.BLACK);
          drawXAxis(ctx, xr);
          drawXAxisTooltip(ctx, xr, y, crosshairRef.current);
        }
      });
    }, [xr, y]);

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
          gridTemplateRows: "2fr 1fr auto",
          gridTemplateAreas: `"plot-area" "study-area" "x-axis"`,
          gap: "0",
          paddingTop: "8px",
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
