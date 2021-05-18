import { BigNumber } from "bignumber.js";

export function addDecimal(value: string, decimals: number): string {
  if (!decimals) return value;
  return new BigNumber(value)
    .dividedBy(Math.pow(10, decimals))
    .toFixed(decimals);
}
export function removeDecimal(value: string, decimals: number): string {
  if (!decimals) return value;
  return new BigNumber(value).times(Math.pow(10, decimals)).toFixed(0);
}

/**
 * Formats a number with commas and inserts a decimal place
 */
export function formatNumber(value: string, decimalPlaces: number): string {
  return numberWithCommas(addDecimal(value, decimalPlaces));
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
