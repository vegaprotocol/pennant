import { string2hex } from "@ui/renderer";
import { COLORS } from "@util/misc";

export interface Colors {
  backgroundSurface: number;
  positiveFill: number;
  positiveStroke: number;
  emphasis100: number;
  emphasis200: number;
  negativeFill: number;
  negativeStroke: number;
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
        .trim() || "#0a0a0a",
    ),
    positiveFill: string2hex(
      cssStyleDeclaration
        ?.getPropertyValue("--pennant-color-price-positive-fill")
        .trim() || "#16452d",
    ),
    positiveStroke: string2hex(
      cssStyleDeclaration
        ?.getPropertyValue("--pennant-color-price-positive-stroke")
        .trim() || "#26ff8a",
    ),
    emphasis100: string2hex(
      cssStyleDeclaration
        ?.getPropertyValue("--pennant-color-emphasis-100")
        .trim() || "ff268a",
    ),
    emphasis200: string2hex(
      cssStyleDeclaration
        ?.getPropertyValue("--pennant-color-emphasis-200")
        .trim() || "ff268a",
    ),
    negativeFill: string2hex(
      cssStyleDeclaration
        ?.getPropertyValue("--pennant-color-price-negative-fill")
        .trim() || "#800700",
    ),
    negativeStroke: string2hex(
      cssStyleDeclaration
        ?.getPropertyValue("--pennant-color-price-negative-stroke")
        .trim() || "#ff261a",
    ),
    textPrimary: string2hex(
      cssStyleDeclaration
        ?.getPropertyValue("--pennant-font-color-base")
        .trim() || "#ffffff",
    ),
    textSecondary: string2hex(
      cssStyleDeclaration
        ?.getPropertyValue("--pennant-font-color-secondary")
        .trim() || "#fafafa",
    ),
    accent1: string2hex(
      cssStyleDeclaration?.getPropertyValue("--pennant-accent1").trim() ||
        COLORS.VEGA_ORANGE,
    ),
    accent2: string2hex(
      cssStyleDeclaration?.getPropertyValue("--pennant-accent2").trim() ||
        COLORS.VEGA_YELLOW,
    ),
    accent3: string2hex(
      cssStyleDeclaration?.getPropertyValue("--pennant-accent3").trim() ||
        COLORS.VEGA_RED,
    ),
    accent4: string2hex(
      cssStyleDeclaration?.getPropertyValue("--pennant-accent4").trim() ||
        COLORS.VEGA_YELLOW,
    ),
    accent5: string2hex(
      cssStyleDeclaration?.getPropertyValue("--pennant-accent5").trim() ||
        COLORS.VEGA_ORANGE,
    ),
    accent6: string2hex(
      cssStyleDeclaration?.getPropertyValue("--pennant-accent6").trim() ||
        COLORS.VEGA_RED,
    ),
  };
}
