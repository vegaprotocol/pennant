import { COLORS } from "../../../helpers";
import { string2hex } from "../../../renderer/utils";

export interface Colors {
  backgroundSurface: number;
  buyFill: number;
  buyStroke: number;
  emphasis100: number;
  emphasis200: number;
  sellFill: number;
  sellStroke: number;
  textPrimary: number;
  textSecondary: number;
  accent1: number;
  accent2: number;
  accent3: number;
  accent4: number;
  accent5: number;
  accent6: number;
}

export function getColors(element: HTMLElement | null): Colors {
  const cssStyleDeclaration = element ? getComputedStyle(element) : null;

  return {
    backgroundSurface: string2hex(
      cssStyleDeclaration
        ?.getPropertyValue("--pennant-background-surface-color")
        .trim() || "#0a0a0a"
    ),
    buyFill: string2hex(
      cssStyleDeclaration
        ?.getPropertyValue("--pennant-color-depth-buy-fill")
        .trim() || "#16452d"
    ),
    buyStroke: string2hex(
      cssStyleDeclaration
        ?.getPropertyValue("--pennant-color-depth-buy-stroke")
        .trim() || "#26ff8a"
    ),
    emphasis100: string2hex(
      cssStyleDeclaration
        ?.getPropertyValue("--pennant-color-emphasis-100")
        .trim() || "ff268a"
    ),
    emphasis200: string2hex(
      cssStyleDeclaration
        ?.getPropertyValue("--pennant-color-emphasis-200")
        .trim() || "ff268a"
    ),
    sellFill: string2hex(
      cssStyleDeclaration
        ?.getPropertyValue("--pennant-color-depth-sell-fill")
        .trim() || "#800700"
    ),
    sellStroke: string2hex(
      cssStyleDeclaration
        ?.getPropertyValue("--pennant-color-depth-sell-stroke")
        .trim() || "#ff261a"
    ),
    textPrimary: string2hex(
      cssStyleDeclaration
        ?.getPropertyValue("--pennant-font-color-base")
        .trim() || "#ffffff"
    ),
    textSecondary: string2hex(
      cssStyleDeclaration
        ?.getPropertyValue("--pennant-font-color-secondary")
        .trim() || "#fafafa"
    ),
    accent1: string2hex(
      cssStyleDeclaration?.getPropertyValue("--pennant-accent1").trim() ||
        COLORS.VEGA_ORANGE
    ),
    accent2: string2hex(
      cssStyleDeclaration?.getPropertyValue("--pennant-accent2").trim() ||
        COLORS.VEGA_YELLOW
    ),
    accent3: string2hex(
      cssStyleDeclaration?.getPropertyValue("--pennant-accent3").trim() ||
        COLORS.VEGA_RED
    ),
    accent4: string2hex(
      cssStyleDeclaration?.getPropertyValue("--pennant-accent4").trim() ||
        COLORS.VEGA_YELLOW
    ),
    accent5: string2hex(
      cssStyleDeclaration?.getPropertyValue("--pennant-accent5").trim() ||
        COLORS.VEGA_ORANGE
    ),
    accent6: string2hex(
      cssStyleDeclaration?.getPropertyValue("--pennant-accent6").trim() ||
        COLORS.VEGA_RED
    ),
  };
}
