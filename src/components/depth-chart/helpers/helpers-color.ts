import { string2hex } from "../../../renderer/utils";

export interface Colors {
  buyFill: number;
  buyStroke: number;
  sellFill: number;
  sellStroke: number;
  backgroundSurface: number;
  textPrimary: number;
  textSecondary: number;
}

export function getColors(element: HTMLElement): Colors {
  const cssStyleDeclaration = getComputedStyle(element);

  return {
    buyFill: string2hex(
      cssStyleDeclaration.getPropertyValue("--pennant-color-buy-fill").trim() ||
        "#16452d"
    ),
    buyStroke: string2hex(
      cssStyleDeclaration
        .getPropertyValue("--pennant-color-buy-stroke")
        .trim() || "#26ff8a"
    ),
    sellFill: string2hex(
      cssStyleDeclaration
        .getPropertyValue("--pennant-color-sell-fill")
        .trim() || "#800700"
    ),
    sellStroke: string2hex(
      cssStyleDeclaration
        .getPropertyValue("--pennant-color-sell-stroke")
        .trim() || "#ff261a"
    ),
    textPrimary: string2hex(
      cssStyleDeclaration
        .getPropertyValue("--pennant-font-color-base")
        .trim() || "#ffffff"
    ),
    textSecondary: string2hex(
      cssStyleDeclaration
        .getPropertyValue("--pennant-font-color-secondary")
        .trim() || "#fafafa"
    ),
    backgroundSurface: string2hex(
      cssStyleDeclaration
        .getPropertyValue("--pennant-background-surface-color")
        .trim() || "#0a0a0a"
    ),
  };
}
