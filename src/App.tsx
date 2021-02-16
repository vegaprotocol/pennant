import "d3-transition";

import * as React from "react";

import { ScaleLinear, ScaleTime, scaleLinear, scaleTime } from "d3-scale";
import { extent, max, min } from "d3-array";
import { zoom, zoomIdentity } from "d3-zoom";

import data from "./data.json";
import { select } from "d3-selection";

const candles = data.map((d) => ({ ...d, date: new Date(d.date) }));

console.log(candles);

const CHART_HEIGHT = 400;

function App() {
  const chartRef = React.useRef<HTMLCanvasElement>(null);
  const timeAxisRef = React.useRef<HTMLCanvasElement>(null);
  const context = React.useRef<CanvasRenderingContext2D>(null!);

  const timeScale = scaleTime()
    .domain(extent(candles.map((d) => d.date)) as [Date, Date])
    .range([0, 800]);

  const yScale = scaleLinear()
    .domain([
      min(candles.map((d) => d.low)) as number,
      max(candles.map((d) => d.high)) as number,
    ])
    .range([CHART_HEIGHT, 0]);

  function drawCandle(
    context: CanvasRenderingContext2D,
    scaleX: ScaleTime<number, number, never>,
    scaleY: ScaleLinear<number, number, never>,
    d: any,
    width: number
  ) {
    const up = d.open <= d.close;

    context.fillStyle = up ? "green" : "red";
    context.strokeStyle = up ? "green" : "red";

    // TODO: We want pixel perfect (no blur) but think about rounding, which direction makes most sense in context?
    context.fillRect(
      Math.floor(scaleX(d.date)) - width / 2, // TODO: It matters whether width is odd or even
      Math.floor(scaleY(up ? d.close : d.open)),
      width,
      Math.ceil(Math.abs(scaleY(d.close) - scaleY(d.open)))
    );


    context.beginPath();
    context.moveTo(Math.floor(scaleX(d.date)), Math.floor(scaleY(d.low)));
    context.lineTo(Math.floor(scaleX(d.date)), Math.floor(scaleY(d.high)));
    context.stroke();
  }

  function draw(context: CanvasRenderingContext2D, transform: any) {
    const scaleX = transform.rescaleX(timeScale);
    const scaleY = transform.rescaleY(yScale);

    const width =
      (Math.floor(scaleX(1000 * 60 * 5)) - Math.floor(scaleX(0))) / (1 + 0.2);

    context.clearRect(0, 0, 800, CHART_HEIGHT);

    candles.forEach((candle) => {
      drawCandle(context, scaleX, scaleY, candle, width);
    });
  }

  function zoomed(transform: any) {
    context.current.save();
    draw(context.current, transform);
    context.current.restore();
  }

  const canvasZoom = zoom<HTMLCanvasElement, unknown>()
    .scaleExtent([0.2, 20])
    .on("zoom", ({ transform }) => zoomed(transform));

  React.useEffect(() => {
    const canvas = chartRef.current;

    if (canvas) {
      const ctx = canvas.getContext("2d");

      if (context) {
        context.current = ctx as CanvasRenderingContext2D;
        select(canvas).call(canvasZoom);

        zoomed(zoomIdentity);
      }
    }
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        margin: "8px",
      }}
    >
      <canvas
        ref={chartRef}
        width={800}
        height={CHART_HEIGHT}
        style={{
          width: "800px",
          height: "CHART_HEIGHTpx",
          border: "1px solid grey",
        }}
      ></canvas>
      <canvas
        ref={timeAxisRef}
        width={800}
        height={100}
        style={{ width: "800px", height: "100px", border: "1px solid grey" }}
      ></canvas>
      <button
        onClick={() => {
          select(chartRef.current!)
            .transition()
            .duration(750)
            .call(canvasZoom.transform, zoomIdentity);
        }}
      >
        Scroll to most recent
      </button>
    </div>
  );
}

export default App;
