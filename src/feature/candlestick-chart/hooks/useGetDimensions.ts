import { string2num } from "@util/misc";
import { useMemo } from "react";

export interface Dimensions {
  strokeWidth: number;
  innerPadding: number;
  maxPaddingInPixels: number;
}

export function useGetDimensions(element: HTMLElement | null): Dimensions {
  const cssStyleDeclaration = element ? getComputedStyle(element) : null;

  const strokeWidth = string2num(
    cssStyleDeclaration
      ?.getPropertyValue("--pennant-candlestick-stroke-width")
      .trim() || "1px",
  );
  const innerPadding = string2num(
    cssStyleDeclaration
      ?.getPropertyValue("--pennant-candlestick-inner-padding")
      .trim() || "0.4",
  );
  const maxPaddingInPixels = string2num(
    cssStyleDeclaration
      ?.getPropertyValue("--pennant-candlestick-max-padding-in-pixels")
      .trim() || "2px",
  );

  return useMemo(
    () => ({ strokeWidth, innerPadding, maxPaddingInPixels }),
    [strokeWidth, innerPadding, maxPaddingInPixels],
  );
}
