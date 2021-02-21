import "d3-transition";

import * as React from "react";

import { ZoomTransform, zoom as d3Zoom, zoomIdentity } from "d3-zoom";
import { extent, max, min } from "d3-array";
import { scaleLinear, scaleUtc } from "d3-scale";

// TODO: Rename element to shape
import { BarElement } from "./element-bar";
import { CandleElement } from "./element-candle";
import { Colors } from "../lib/vega-colours";
import { Interval } from "../data/globalTypes";
import { VegaCanvas } from "./vega-canvas";
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

function useZoom(onZoom: any, onEnd: any) {
  const ref = React.useRef(d3Zoom());
  ref.current.on("zoom", onZoom).on("end", onEnd);
  return ref.current;
}

function useScale(scale: any) {
  const ref = React.useRef(scale.copy());
  return ref;
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

function drawCrosshair(
  ctx: CanvasRenderingContext2D,
  xScale: any,
  yScale: any,
  x: any,
  y: any
) {
  ctx.save();
  ctx.beginPath();

  const yRange = yScale.range().map(Math.round);

  ctx.moveTo(Math.round(xScale(x)), yRange[0]);
  ctx.lineTo(Math.round(xScale(x)), yRange[1]);

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
    ctx.fillText(tickFormat(tick), xScale(tick), 4);
    ctx.closePath();
  });
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
  onBoundsChange?: (bounds: [Date, Date]) => void;
  onGetDataRange: (from: string, to: string) => void;
};

export const CandlestickChart = ({
  data,
  interval,
  onBoundsChange,
  onGetDataRange,
}: CandleStickChartProps) => {
  const [isPinned, setIsPinned] = React.useState(true);
  const zoomRef = React.useRef<HTMLDivElement | null>(null);

  const chartRef = React.useRef<HTMLCanvasElement | null>(null);
  const chartContextRef = React.useRef<CanvasRenderingContext2D | null>(null);

  const chartCrosshairRef = React.useRef<HTMLCanvasElement | null>(null);
  const chartCrosshairContextRef = React.useRef<CanvasRenderingContext2D | null>(
    null
  );

  const chartInteractionRef = React.useRef<HTMLDivElement>(null!);

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

  const [isPresent, setIsPresent] = React.useState(true);

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

  const x = scaleUtc()
    .domain(extent(data, (d) => d.date) as [Date, Date])
    .range([0, chartRef?.current?.width ?? 300]);

  const y = scaleLinear()
    .domain([min(data, (d) => d.low), max(data, (d) => d.high)] as [
      number,
      number
    ])
    .range([chartRef?.current?.height ?? 150, 0])
    .nice();

  const volumeScale = scaleLinear()
    .domain(extent(data, (d) => d.volume) as [number, number])
    .range([HEIGHT / 2, 0]);

  const xr = useScale(x);
  const yr = useScale(y);

  const draw = React.useCallback(() => {
    const xScale = xr.current;
    const yScale = yr.current;

    if (chartContextRef.current) {
      const context = chartContextRef.current;

      context.save();
      clearCanvas(chartRef.current!, context, Colors.GRAY_DARK); // FIXME: Don't use !

      drawGrid(context, xScale, yScale);

      for (const candle of candles) {
        candle.draw(context, xScale, yScale);
      }

      context.restore();
    }

    if (chartCrosshairContextRef.current) {
      const context = chartCrosshairContextRef.current;

      context.save();
      drawCrosshair(context, xScale, yScale, new Date(2021, 17, 12), 600);
      context.restore();
    }

    if (yAxisContextRef.current) {
      const context = yAxisContextRef.current;

      context.save();
      clearCanvas(yAxisRef.current!, context, Colors.GRAY_DARK); // FIXME: Don't use !

      drawYAxis(context, yScale);

      context.restore();
    }

    if (studyChartContextRef.current) {
      const context = studyChartContextRef.current;

      context.save();
      clearCanvas(studyChartRef.current!, context, Colors.GRAY_DARK); // FIXME: Don't use !

      drawGrid(context, xScale, volumeScale);

      for (const bar of bars) {
        bar.draw(context, xScale, volumeScale);
      }

      context.restore();
    }

    if (studyYAxisContextRef.current) {
      const context = studyYAxisContextRef.current;

      context.save();
      clearCanvas(studyYAxisRef.current!, context, Colors.GRAY_DARK); // FIXME: Don't use !

      drawYAxis(context, volumeScale);

      context.restore();
    }

    if (xAxisContextRef.current) {
      const context = xAxisContextRef.current;

      context.save();
      clearCanvas(xAxisRef.current!, context, Colors.GRAY_DARK); // FIXME: Don't use !

      drawXAxis(context, xScale);

      context.restore();
    }
  }, [bars, candles, volumeScale, xr, yr]);

  // FIXME: When closed over this is stale?
  const zoomed = (transform: ZoomTransform, interactive = true) => {
    xr.current = transform.rescaleX(x);
    yr.current = transform.rescaleY(y);

    draw();

    const dataWindow = extent(data, (d) => d.date) as [Date, Date];
    const domain = xr.current.domain();
    const viewWindow = [domain[0], domain[domain.length - 1]] as [Date, Date];

    const viewWindowWidth = viewWindow[1].getTime() - viewWindow[0].getTime();

    // Notify listeners
    onBoundsChange?.(viewWindow);

    if (
      viewWindow[0].getTime() <
      dataWindow[0].getTime() +
        viewWindow[1].getTime() -
        viewWindow[0].getTime()
    ) {
      throttledOnGetDataRange(
        new Date(dataWindow[0].getTime() - 2 * viewWindowWidth).toISOString(),
        new Date(dataWindow[0].getTime()).toISOString()
      );
    }
  };

  const zoom = useZoom(
    ({ transform }: any) => zoomed(transform),
    () => {}
  );

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

  const reset = () => {
    select(zoomRef.current as Element)
      .transition()
      .duration(200)
      .call(zoom.transform, zoomIdentity)
      .end()
      .then(() => {
        setIsPinned(false);
      });
  };

  React.useEffect(() => {
    select(zoomRef.current as Element).call(zoom);

    zoomed(zoomIdentity);
  }, [zoom]);

  /*   React.useEffect(() => {
    xr.current = x.copy();
    yr.current = y.copy();

    draw();
  }, [draw, x, xr, y, yr]);
 */
  //draw();

  // Attach event listener to chart crosshair layer
  React.useEffect(() => {
    console.log(chartInteractionRef);
    select(chartInteractionRef.current).on("mousemove", console.log);
  }, []);

  return (
    <div
      ref={zoomRef}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gridTemplateRows: "2fr 1fr auto",
        gridTemplateAreas: `"chart y-axis" "study-chart study-y-axis" "x-axis corner"`,
        gap: "0",
        paddingTop: "8px",
        width: "100%",
        height: "100%",
      }}
    >
      <div
        style={{
          gridArea: "chart",
          borderBottom: `1px solid ${Colors.GRAY_DARK_2}`,
          position: "relative",
        }}
      >
        <VegaCanvas
          ref={(element) => {
            if (element) {
              chartRef.current = element;
              chartContextRef.current = element.getContext("2d");
            }
          }}
          style={{ position: "absolute" }}
        ></VegaCanvas>
        <VegaCanvas
          ref={(element) => {
            if (element) {
              chartCrosshairRef.current = element;
              chartCrosshairContextRef.current = element.getContext("2d");
            }
          }}
          style={{ position: "absolute" }}
        ></VegaCanvas>
        <div
          ref={chartInteractionRef}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      <div
        style={{
          gridArea: "y-axis",
          borderLeft: `1px solid ${Colors.GRAY_DARK_2}`,
          borderBottom: `1px solid ${Colors.GRAY_DARK_2}`,
        }}
      >
        <VegaCanvas
          width={60}
          ref={(element) => {
            if (element) {
              yAxisRef.current = element;
              yAxisContextRef.current = element.getContext("2d");
            }
          }}
        ></VegaCanvas>
      </div>
      <div
        style={{
          gridArea: "study-chart",
          borderBottom: `1px solid ${Colors.GRAY_DARK_2}`,
        }}
      >
        <VegaCanvas
          ref={(element) => {
            if (element) {
              studyChartRef.current = element;
              studyChartContextRef.current = element.getContext("2d");
            }
          }}
        ></VegaCanvas>
      </div>
      <div
        style={{
          gridArea: "study-y-axis",
          borderLeft: `1px solid ${Colors.GRAY_DARK_2}`,
          borderBottom: `1px solid ${Colors.GRAY_DARK_2}`,
        }}
      >
        <VegaCanvas
          width={60}
          ref={(element) => {
            if (element) {
              studyYAxisRef.current = element;
              studyYAxisContextRef.current = element.getContext("2d");
            }
          }}
        ></VegaCanvas>
      </div>
      <div style={{ gridArea: "x-axis" }}>
        <VegaCanvas
          ref={(element) => {
            if (element) {
              xAxisRef.current = element;
              xAxisContextRef.current = element.getContext("2d");
            }
          }}
          height={20}
        ></VegaCanvas>
      </div>
      <div
        style={{
          gridArea: "corner",
          backgroundColor: Colors.GRAY_DARK,
          borderLeft: `1px solid ${Colors.GRAY_DARK_2}`,
        }}
        onClick={() => reset()}
      />
    </div>
  );
};
