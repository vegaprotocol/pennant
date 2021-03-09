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
