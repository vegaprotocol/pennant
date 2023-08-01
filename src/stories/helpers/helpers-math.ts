import { BigNumber } from "bignumber.js";

export function parseVegaDecimal(
  value: string,
  decimalPlaces: number = 0,
): number {
  return new BigNumber(value).dividedBy(Math.pow(10, decimalPlaces)).toNumber();
}

/**
 * Formats a number with commas and inserts a decimal place
 */
export function formatNumber(value: string, decimalPlaces: number): string {
  return numberWithCommas(
    new BigNumber(value)
      .dividedBy(Math.pow(10, decimalPlaces))
      .toFixed(decimalPlaces),
  );
}

/**
 * Adds a commas to a number
 */
export function numberWithCommas(x: number | string) {
  if (typeof x === "number") {
    x = x.toString();
  }

  let parts = x.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return parts.join(".");
}
