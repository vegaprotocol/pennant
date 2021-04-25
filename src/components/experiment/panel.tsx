import { forwardRef } from "react";
import { ChartInfo } from "../chart-info";
import AutoSizer from "react-virtualized-auto-sizer";

export type PanelProps = {
  id: string;
  bounds: [Date, Date];
  showChartInfo: boolean;
  onResize: () => void;
};

export const Panel = forwardRef<HTMLDivElement, PanelProps>(
  ({ id, showChartInfo, bounds, onResize }, ref) => (
    <AutoSizer
      style={{ width: "100%", height: "100%" }}
      onResize={() => {
        console.log("panel resize event ][][][][");
        onResize();
      }}
    >
      {() => (
        <div
          ref={ref}
          style={{
            position: "relative",
            height: "100%",
          }}
        >
          <d3fc-canvas
            id={`plot-area-${id}`}
            class="plot-area"
            use-device-pixel-ratio
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
            }}
          ></d3fc-canvas>
          <d3fc-canvas
            id={`y-axis-${id}`}
            class="y-axis"
            use-device-pixel-ratio
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
            }}
          ></d3fc-canvas>
          <d3fc-svg
            id={`plot-area-interaction-${id}`}
            class="plot-area-interaction"
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
            }}
          ></d3fc-svg>
          <d3fc-svg
            id={`y-axis-interaction-${id}`}
            class="y-axis-interaction"
            style={{
              position: "absolute",
              right: 0,
              width: "64px",
              height: "100%",
              cursor: "ns-resize",
            }}
          ></d3fc-svg>
          {showChartInfo && <ChartInfo bounds={bounds} />}
        </div>
      )}
    </AutoSizer>
  )
);
