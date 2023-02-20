import { COLORS } from "@util/misc";

export interface Colors {
  buyFill: string;
  buyStroke: string;
  sellFill: string;
  sellStroke: string;
  backgroundSurface: string;
  textPrimary: string;
  textSecondary: string;
  emphasis100: string;
  emphasis300: string;
  emphasis400: string;
  emphasis500: string;
  emphasis900: string;
  vegaGreen: string;
  vegaYellow: string;
  vegaOrange: string;
  accent1: string;
  accent2: string;
  accent3: string;
  accent4: string;
  accent5: string;
  accent6: string;

  // Studies
  eldarRayBearPower: string;
  eldarRayBullPower: string;
  forceIndex: string;
  macdDivergenceBuy: string;
  macdDivergenceSell: string;
  macdSignal: string;
  macdMacd: string;
  relativeStrengthIndex: string;
  volumeBuy: string;
  volumeSell: string;
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
    emphasis100:
      cssStyleDeclaration
        ?.getPropertyValue("--pennant-color-emphasis-100")
        .trim() || "#EDEDED",
    emphasis300:
      cssStyleDeclaration
        ?.getPropertyValue("--pennant-color-emphasis-300")
        .trim() || "#494949",
    emphasis400:
      cssStyleDeclaration
        ?.getPropertyValue("--pennant-color-emphasis-400")
        .trim() || "#494949",
    emphasis500:
      cssStyleDeclaration
        ?.getPropertyValue("--pennant-color-emphasis-500")
        .trim() || "#494949",
    emphasis900:
      cssStyleDeclaration
        ?.getPropertyValue("--pennant-color-emphasis-900")
        .trim() || "#333333",
    vegaGreen:
      cssStyleDeclaration?.getPropertyValue("--vega-orange").trim() ||
      COLORS.VEGA_GREEN,
    vegaOrange:
      cssStyleDeclaration?.getPropertyValue("--vega-orange").trim() ||
      COLORS.VEGA_ORANGE,
    vegaYellow:
      cssStyleDeclaration?.getPropertyValue("--vega-yellow").trim() ||
      COLORS.VEGA_YELLOW,
    accent1:
      cssStyleDeclaration?.getPropertyValue("--pennant-accent1").trim() ||
      COLORS.VEGA_ORANGE,
    accent2:
      cssStyleDeclaration?.getPropertyValue("--pennant-accent2").trim() ||
      COLORS.VEGA_YELLOW,
    accent3:
      cssStyleDeclaration?.getPropertyValue("--pennant-accent3").trim() ||
      COLORS.VEGA_RED,
    accent4:
      cssStyleDeclaration?.getPropertyValue("--pennant-accent4").trim() ||
      COLORS.VEGA_YELLOW,
    accent5:
      cssStyleDeclaration?.getPropertyValue("--pennant-accent5").trim() ||
      COLORS.VEGA_ORANGE,
    accent6:
      cssStyleDeclaration?.getPropertyValue("--pennant-accent6").trim() ||
      COLORS.VEGA_RED,
    eldarRayBearPower:
      cssStyleDeclaration
        ?.getPropertyValue("--pennant-color-eldar-ray-bear-power")
        .trim() || COLORS.VEGA_RED,
    eldarRayBullPower:
      cssStyleDeclaration
        ?.getPropertyValue("--pennant-color-eldar-ray-bull-power")
        .trim() || COLORS.VEGA_GREEN,
    forceIndex:
      cssStyleDeclaration
        ?.getPropertyValue("--pennant-color-force-index")
        .trim() || COLORS.VEGA_ORANGE,
    macdDivergenceBuy:
      cssStyleDeclaration
        ?.getPropertyValue("--pennant-color-macd-divergence-buy")
        .trim() || COLORS.VEGA_GREEN,
    macdDivergenceSell:
      cssStyleDeclaration
        ?.getPropertyValue("--pennant-color-macd-divergence-sell")
        .trim() || COLORS.VEGA_RED,
    macdSignal:
      cssStyleDeclaration
        ?.getPropertyValue("--pennant-color-macd-signal")
        .trim() || COLORS.VEGA_ORANGE,
    macdMacd:
      cssStyleDeclaration
        ?.getPropertyValue("--pennant-color-macd-macd")
        .trim() || COLORS.VEGA_YELLOW,
    relativeStrengthIndex:
      cssStyleDeclaration
        ?.getPropertyValue("--pennant-color-relative-strength-index")
        .trim() || COLORS.GRAY,
    volumeBuy:
      cssStyleDeclaration
        ?.getPropertyValue("--pennant-color-volume-buy")
        .trim() || COLORS.VEGA_GREEN,
    volumeSell:
      cssStyleDeclaration
        ?.getPropertyValue("--pennant-color-volume-sell")
        .trim() || COLORS.VEGA_RED,
  };
}

export function getAccentColor(n: number) {
  return `accent${1 + (n % 6)}` as keyof Colors;
}
