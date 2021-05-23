import "./x-axis-view.css";
import "@d3fc/d3fc-element";

import { forwardRef } from "react";

export type XAxisViewProps = {};

export const XAxisView = forwardRef<HTMLDivElement, XAxisViewProps>(
  ({}, ref) => {
    return (
      <div ref={ref} className="x-axis-container">
        <d3fc-canvas class="x-axis" use-device-pixel-ratio />
        <d3fc-svg class="x-axis-interaction" />
      </div>
    );
  }
);
