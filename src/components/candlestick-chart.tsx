import * as React from "react";

import {
  ZoomBehavior,
  ZoomTransform,
  zoom as d3Zoom,
  zoomIdentity,
  zoomTransform,
} from "d3-zoom";
import { candleFill, candleStroke } from "../lib/helpers";
import { extent, max, min } from "d3-array";
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

const WIDTH = 800;
const HEIGHT = 400;
const PADDING_INNER = 0.4;
const Y_AXIS_WIDTH = 30;

function useZoom(callback: any) {
  const ref = React.useRef(d3Zoom().on("zoom", callback));

  return ref.current;
}

export interface CandleDetailsExtended {
  datetime: string;
  date: Date;
  high: number;
  low: number;
  open: number;
  close: number;
  volume: number;
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

function drawYAxis(ctx: CanvasRenderingContext2D, yScale: any) {
  ctx.strokeStyle = "#fff";

  yScale.ticks().forEach((tick: number) => {
    ctx.beginPath();
    ctx.fillStyle = Colors.GRAY_LIGHT;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.font = `12px monospace`;
    ctx.fillText(String(Math.round(tick)), 4, yScale(tick));
    ctx.closePath();
  });
}

export type CandleStickChartProps = {
  data: CandleDetailsExtended[];
  interval: Interval;
  onGetDataRange: (from: string, to: string) => void;
};

export const CandlestickChart = ({
  data,
  interval,
  onGetDataRange,
}: CandleStickChartProps) => {
  const zoomRef = React.useRef<HTMLDivElement | null>(null);

  const ref = React.useRef<HTMLCanvasElement | null>(null);
  const contextRef = React.useRef<CanvasRenderingContext2D | null>(null);

  const yAxisRef = React.useRef<HTMLCanvasElement | null>(null);
  const yAxisContextRef = React.useRef<CanvasRenderingContext2D | null>(null);

  const studyChartRef = React.useRef<HTMLCanvasElement | null>(null);
  const studyChartContextRef = React.useRef<CanvasRenderingContext2D | null>(
    null
  );

  const studyYAxisRef = React.useRef<HTMLCanvasElement | null>(null);
  const studyYAxisContextRef = React.useRef<CanvasRenderingContext2D | null>(
    null
  );

  const xAxisRef = React.useRef<HTMLCanvasElement | null>(null);
  const xAxisContextRef = React.useRef<CanvasRenderingContext2D | null>(null);

  const throttledOnGetDataRange = React.useMemo(
    () => throttle(onGetDataRange, 5000),
    [onGetDataRange]
  );

  const candleWidth = getCandleWidth(interval);

  // Transform data to our intermediate representation. Think of it as a scenegraph
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

  const x = scaleUtc()
    .domain(extent(data, (d) => d.date) as [Date, Date])
    .range([0, WIDTH]);

  const y = scaleLinear()
    .domain(extent(data, (d) => d.open) as [number, number])
    .range([HEIGHT, 0]);

  const volumeScale = scaleLinear()
    .domain(extent(data, (d) => d.volume) as [number, number])
    .range([HEIGHT / 2, 0]);

  // FIXME: When closed over this is stale?
  const zoomed = (transform: ZoomTransform) => {
    const { current } = contextRef;

    const xr = transform.rescaleX(x);
    const yr = transform.rescaleY(y);

    if (current) {
      const context = current;

      context.save();
      clearCanvas(ref.current!, context, "#121212"); // FIXME: Don't use !

      drawGrid(context, xr, yr);

      for (const candle of candles) {
        candle.draw(context, xr, yr);
      }

      context.restore();
    }

    if (yAxisContextRef.current) {
      const context = yAxisContextRef.current;

      context.save();
      clearCanvas(yAxisRef.current!, context, "#121212"); // FIXME: Don't use !

      drawYAxis(context, yr);

      context.restore();
    }

    if (studyChartContextRef.current) {
      const context = studyChartContextRef.current;

      context.save();
      clearCanvas(studyChartRef.current!, context, "#121212"); // FIXME: Don't use !

      for (const bar of bars) {
        bar.draw(context, xr, volumeScale);
      }

      context.restore();
    }

    if (studyYAxisContextRef.current) {
      const context = studyYAxisContextRef.current;

      context.save();
      clearCanvas(studyYAxisRef.current!, context, "#121212"); // FIXME: Don't use !

      context.strokeStyle = "#fff";

      volumeScale.ticks().forEach((tick) => {
        context.beginPath();
        context.moveTo(0, volumeScale(tick));
        context.lineTo(Y_AXIS_WIDTH, volumeScale(tick));
        context.stroke();
        context.closePath();
      });

      context.restore();
    }

    if (xAxisContextRef.current) {
      const context = xAxisContextRef.current;

      context.save();
      clearCanvas(xAxisRef.current!, context, "#121212"); // FIXME: Don't use !

      context.strokeStyle = "#fff";

      xr.ticks().forEach((tick) => {
        context.beginPath();
        context.moveTo(xr(tick), 0);
        context.lineTo(xr(tick), 20);
        context.stroke();
        context.closePath();
      });

      context.restore();
    }

    const dataWindow = extent(data, (d) => d.date) as [Date, Date];
    const viewWindow = xr.domain();

    const viewWindowWidth = viewWindow[1].getTime() - viewWindow[0].getTime();

    if (
      viewWindow[0].getTime() <
      dataWindow[0].getTime() +
        viewWindow[1].getTime() -
        viewWindow[0].getTime()
    ) {
      console.info("Fetch me more data :O");
      throttledOnGetDataRange(
        new Date(dataWindow[0].getTime() - 2 * viewWindowWidth).toISOString(),
        new Date(dataWindow[0].getTime()).toISOString()
      );
    }
  };

  const zoom = useZoom(({ transform }: any) => zoomed(transform));

  zoom
    .scaleExtent([1, 32])
    .extent([
      [0, 0],
      [WIDTH, HEIGHT],
    ])
    .translateExtent([
      [0, -Infinity],
      [WIDTH, Infinity],
    ]);

  React.useEffect(() => {
    select(zoomRef.current as Element).call(zoom);

    zoomed(zoomIdentity);
  }, [zoom]);

  zoomed(zoomIdentity);

  return (
    <div
      ref={zoomRef}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gridTemplateRows: "2fr 1fr auto",
        gridTemplateAreas: `"chart y-axis" "study-chart study-y-axis" "x-axis ."`,
        width: `${WIDTH + Y_AXIS_WIDTH}px`,
        paddingTop: "8px",
      }}
    >
      <canvas
        ref={(element) => {
          if (element) {
            ref.current = element;
            contextRef.current = element.getContext("2d");
          }
        }}
        width={WIDTH}
        height={HEIGHT}
        style={{ gridArea: "chart" }}
      ></canvas>
      <canvas
        ref={(element) => {
          if (element) {
            yAxisRef.current = element;
            yAxisContextRef.current = element.getContext("2d");
          }
        }}
        width={Y_AXIS_WIDTH}
        height={HEIGHT}
        style={{ gridArea: "y-axis" }}
      ></canvas>
      <canvas
        ref={(element) => {
          if (element) {
            studyChartRef.current = element;
            studyChartContextRef.current = element.getContext("2d");
          }
        }}
        width={WIDTH}
        height={HEIGHT / 2}
        style={{ gridArea: "study-chart" }}
      ></canvas>
      <canvas
        ref={(element) => {
          if (element) {
            studyYAxisRef.current = element;
            studyYAxisContextRef.current = element.getContext("2d");
          }
        }}
        width={Y_AXIS_WIDTH}
        height={HEIGHT / 2}
        style={{ gridArea: "study-y-axis" }}
      ></canvas>
      <canvas
        ref={(element) => {
          if (element) {
            xAxisRef.current = element;
            xAxisContextRef.current = element.getContext("2d");
          }
        }}
        width={WIDTH}
        height={20}
        style={{ gridArea: "x-axis" }}
      ></canvas>
    </div>
  );
};
