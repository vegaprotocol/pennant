import { string2num } from "@util/misc";

export interface Dimensions {
  strokeWidth: number;
  innerPadding: number;
}

export function getDimensions(element: HTMLElement | null): Dimensions {
  const cssStyleDeclaration = element ? getComputedStyle(element) : null;

  return {
    strokeWidth: string2num(
      cssStyleDeclaration
        ?.getPropertyValue("--pennant-candlestick-stroke-width")
        .trim() || "1px",
    ),
    innerPadding: string2num(
      cssStyleDeclaration
        ?.getPropertyValue("--pennant-candlestick-inner-padding")
        .trim() || "0.4",
    ),
  };
}
