import { COLORS } from "../../../helpers";

export interface Colors {
  buyFill: string;
  buyStroke: string;
  sellFill: string;
  sellStroke: string;
  backgroundSurface: string;
  textPrimary: string;
  textSecondary: string;
  emphasis300: string;
  vegaGreen: string;
  vegaYellow: string;
  vegaOrange: string;
}

export function getColors(element: HTMLElement | null): Colors {
  const cssStyleDeclaration = element ? getComputedStyle(element) : null;

  return {
    buyFill:
      cssStyleDeclaration
        ?.getPropertyValue("--pennant-color-buy-fill")
        .trim() || "#16452d",
    buyStroke:
      cssStyleDeclaration
        ?.getPropertyValue("--pennant-color-buy-stroke")
        .trim() || "#26ff8a",
    sellFill:
      cssStyleDeclaration
        ?.getPropertyValue("--pennant-color-sell-fill")
        .trim() || "#800700",
    sellStroke:
      cssStyleDeclaration
        ?.getPropertyValue("--pennant-color-sell-stroke")
        .trim() || "#ff261a",
    textPrimary:
      cssStyleDeclaration
        ?.getPropertyValue("--pennant-font-color-base")
        .trim() || "#ffffff",
    textSecondary:
      cssStyleDeclaration
        ?.getPropertyValue("--pennant-font-color-secondary")
        .trim() || "#fafafa",
    backgroundSurface:
      cssStyleDeclaration
        ?.getPropertyValue("--pennant-background-surface-color")
        .trim() || "#d9822b",
    emphasis300:
      cssStyleDeclaration
        ?.getPropertyValue("--pennant-color-emphasis-200")
        .trim() || "#494949",
    vegaGreen:
      cssStyleDeclaration?.getPropertyValue("--vega-orange").trim() ||
      COLORS.VEGA_GREEN,
    vegaOrange:
      cssStyleDeclaration?.getPropertyValue("--vega-orange").trim() ||
      COLORS.VEGA_ORANGE,
    vegaYellow:
      cssStyleDeclaration?.getPropertyValue("--vega-yellow").trim() ||
      COLORS.VEGA_YELLOW,
  };
}
