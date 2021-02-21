import * as React from "react";

import AutoSizer from "react-virtualized-auto-sizer";

export type VegaCanvasProps = {
  width?: number;
  height?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
};

// TODO: Force redraw if resize event fired (onResize)
export const VegaCanvas = React.forwardRef<HTMLCanvasElement, VegaCanvasProps>(
  ({ width, height, children, style }, ref) => {
    return (
      <AutoSizer disableWidth={Boolean(width)} disableHeight={Boolean(height)}>
        {({ height: h, width: w }: { height: number; width: number }) => {
          return (
            <canvas
              width={width ?? w}
              height={height ?? h}
              ref={ref}
              style={{ display: "block", ...style }}
            >
              {children}
            </canvas>
          );
        }}
      </AutoSizer>
    );
  }
);
