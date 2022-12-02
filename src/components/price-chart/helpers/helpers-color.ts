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
  };
}
