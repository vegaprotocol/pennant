import "d3-transition";
import "@d3fc/d3fc-element";

import * as React from "react";

import { ZoomTransform, zoom as d3Zoom, zoom, zoomIdentity } from "d3-zoom";
import { extent, max, min } from "d3-array";
import { scaleLinear, scaleUtc } from "d3-scale";

// TODO: Rename element to shape
import { BarElement } from "./element-bar";
import { CandleElement } from "./element-candle";
import { Colors } from "../lib/vega-colours";
import { Interval } from "../data/globalTypes";
import { clearCanvas } from "./helpers";
import fcZoom from "../lib/zoom";
import { format } from "date-fns";
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

const HEIGHT = 400;
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
  const xTicks = xScale.ticks();
  const yTicks = yScale.ticks();

  const xRange = xScale.range().map(Math.round);
  const yRange = yScale.range().map(Math.round);

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

  xScale.ticks().forEach((tick: number) => {
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
    ctx.strokeStyle = "white";
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

  yScale.ticks().forEach((tick: number) => {
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
    ctx.fillText(String(Math.round(tick)), xScale.range()[1] - 5, yScale(tick));
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
  data: CandleDetailsExtended[];
  interval: Interval;
  onBoundsChange?: (bounds: [Date, Date]) => void;
  onMouseMove?: (position: [number, number]) => void;
  onMouseOut?: () => void;
  onMouseOver?: () => void;
  onRightClick?: (position: [number, number]) => void;
  onGetDataRange: (from: string, to: string) => void;
};

export const CandlestickChart = ({
  data,
  interval,
  onBoundsChange,
  onMouseMove,
  onMouseOut,
  onMouseOver,
  onRightClick,
  onGetDataRange,
}: CandleStickChartProps) => {
  const isPinnedRef = React.useRef(true);
  const previousZoomTransform = React.useRef(zoomIdentity);

  const zoomControl2 = React.useMemo(
    () =>
      d3Zoom().on("zoom", (event) => {
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

  const volumeScale = scaleLinear()
    .domain(
      extent(data, (d: CandleDetailsExtended) => d.volume) as [number, number]
    )
    .range([HEIGHT / 2, 0]);

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

      previousZoomTransform.current = transform;

      (select(chartRef.current).node() as any).requestRedraw();
    },
    [x, xr]
  );

  const zoomControl = React.useMemo(
    () => (fcZoom() as any).on("zoom", render),
    [render]
  );

  const reset = React.useCallback(function reset() {
    select(plotYAxisRef.current)
      .transition()
      .duration(750)
      .call(zoom, zoomIdentity);

    (select(chartRef.current).node() as any).requestRedraw();
  }, []);

  // Plot area
  React.useEffect(() => {
    select(plotAreaRef.current)
      .on("measure", (event: any) => {
        const { height, width } = event.detail;
        xr.range([0, width]);
        y.range([height, 0]);
      })
      .on("draw", (event) => {
        const { child, pixelRatio } = event.detail;
        const ctx = child.getContext("2d");

        ctx.save();
        ctx.scale(pixelRatio, pixelRatio);

        if (ctx) {
          clearCanvas(child, ctx, Colors.BLACK);
          drawGrid(ctx, xr, y);

          for (const candle of candles) {
            candle.draw(ctx, xr, y);
          }
        }

        ctx.restore();
      });
  }, [candles, xr, y, zoomControl]);

  // Plot y axis
  React.useEffect(() => {
    const container = select<Element, unknown>(plotYAxisRef.current)
      .on("measure", (event: any) => {
        const { height, width } = event.detail;
        x.range([0, width]);
        y.range([height, 0]);
      })
      .on("draw", (event) => {
        const { child, pixelRatio } = event.detail;
        const ctx = child.getContext("2d");

        ctx.save();
        ctx.scale(pixelRatio, pixelRatio);

        if (ctx) {
          drawYAxis(ctx, x, y);
          drawYAxisTooltip(ctx, xr, y, crosshairRef.current);
        }

        ctx.restore();
      });

    container.call(zoomControl2);
  }, [x, y, zoomControl2]);

  // Plot crosshair
  React.useEffect(() => {
    const container = select<Element, unknown>(plotCrosshairRef.current)
      .on("measure", (event: any) => {
        const { height, width } = event.detail;
        x.range([0, width]);
        y.range([height, 0]);
      })
      .on("draw", (event) => {
        const { child, pixelRatio } = event.detail;
        const ctx = child.getContext("2d");

        ctx.save();
        ctx.scale(pixelRatio, pixelRatio);

        if (ctx) {
          drawYAxis(ctx, x, y);
        }

        ctx.restore();
      });

    select(plotYAxisRef.current)
      .on("mousemove", (event) => {
        const { offsetX, offsetY } = event;

        const canvas = select(plotCrosshairRef.current)
          ?.select("canvas")
          ?.node() as HTMLCanvasElement;

        const ctx = canvas.getContext("2d");

        crosshairRef.current = [offsetX, offsetY];

        clearCanvas(canvas, ctx!);
        drawCrosshair(ctx!, x, y, offsetX, offsetY);

        (xAxisRef.current as any).requestRedraw();
        (plotYAxisRef.current as any).requestRedraw();

        onMouseMove?.([offsetX, offsetY]);
      })
      .on("mouseout", () => {
        crosshairRef.current = null;
      });
  }, [onMouseMove, x, y, zoomControl2]);

  // Study
  React.useEffect(() => {
    select(studyAreaRef.current)
      .on("measure", (event: any) => {
        const { height, width } = event.detail;
        x.range([0, width]);
        volumeScale.range([height, 0]);
      })
      .on("draw", (event) => {
        const canvas = select(studyAreaRef.current)
          ?.select("canvas")
          ?.node() as HTMLCanvasElement;

        const ctx: CanvasRenderingContext2D | null = canvas?.getContext("2d");

        if (ctx) {
          clearCanvas(canvas, ctx, Colors.BLACK);
          drawGrid(ctx, x, volumeScale);

          for (const bar of bars) {
            bar.draw(ctx, x, volumeScale);
          }
        }
      });
  }, [bars, x, volumeScale]);

  // Study y axis
  React.useEffect(() => {
    select(studyYAxisRef.current)
      .on("measure", (event: any) => {
        const { height, width } = event.detail;
        x.range([0, width]);
        volumeScale.range([height, 0]);
      })
      .on("draw", (event) => {
        const { child, pixelRatio } = event.detail;
        const ctx = child.getContext("2d");

        ctx.save();
        ctx.scale(pixelRatio, pixelRatio);

        if (ctx) {
          drawYAxis(ctx, x, volumeScale);
        }

        ctx.restore();
      });
  }, [x, volumeScale]);

  // X axis
  React.useEffect(() => {
    select(xAxisRef.current).on("draw", (event) => {
      const canvas = select(xAxisRef.current)
        ?.select("canvas")
        ?.node() as HTMLCanvasElement;

      const ctx: CanvasRenderingContext2D | null = canvas?.getContext("2d");

      if (ctx) {
        clearCanvas(canvas, ctx, "#121212");
        drawXAxis(ctx, x);
        drawXAxisTooltip(ctx, xr, y, crosshairRef.current);
      }
    });
  }, [x, xr, y]);

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
            cursor: "crosshair",
          }}
        ></d3fc-canvas>
        <d3fc-canvas
          ref={plotYAxisRef}
          style={{ position: "absolute", width: "100%", height: "100%" }}
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
          style={{ position: "absolute", width: "100%", height: "100%" }}
        ></d3fc-canvas>
      </div>
      <div
        style={{ gridArea: "x-axis", position: "relative" }}
        onClick={() => {
          console.log("RESET");
          reset();
        }}
      >
        <d3fc-canvas
          ref={xAxisRef}
          style={{ width: "100%", height: "26px" }}
        ></d3fc-canvas>
      </div>
    </d3fc-group>
  );
};
