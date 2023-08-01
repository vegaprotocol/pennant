import { BigNumber } from "bignumber.js";
import { BigNumber as EthersBigNumber } from "ethers";
import isNil from "lodash/isNil";
import memoize from "lodash/memoize";
import { useMemo } from "react";

const MIN_FRACTION_DIGITS = 2;
const MAX_FRACTION_DIGITS = 20;

export function toDecimal(numberOfDecimals: number) {
  return 1 / Math.pow(10, numberOfDecimals);
}

export function toBigNum(
  rawValue: string | number | EthersBigNumber,
  decimals: number,
): BigNumber {
  return new BigNumber(
    rawValue instanceof EthersBigNumber ? rawValue.toString() : rawValue || 0,
  ).dividedBy(Math.pow(10, decimals));
}

export function addDecimal(
  value: string | number | EthersBigNumber,
  decimals: number,
  decimalPrecision = decimals,
): string {
  if (!decimals) return value.toString();
  if (!decimalPrecision || decimalPrecision < 0) {
    return toBigNum(value, decimals).toFixed(0);
  }
  return toBigNum(value, decimals).toFixed(decimalPrecision);
}

export function removeDecimal(value: string, decimals: number): string {
  if (!decimals) return value;
  return new BigNumber(value || 0).times(Math.pow(10, decimals)).toFixed(0);
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat
export const getNumberFormat = memoize((digits: number) => {
  if (isNil(digits) || digits < 0) {
    return new Intl.NumberFormat("default");
  }
  return new Intl.NumberFormat("default", {
    minimumFractionDigits: Math.min(Math.max(0, digits), MIN_FRACTION_DIGITS),
    maximumFractionDigits: Math.min(Math.max(0, digits), MAX_FRACTION_DIGITS),
  });
});

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat
export const getFixedNumberFormat = memoize((digits: number) => {
  if (isNil(digits) || digits < 0) {
    return new Intl.NumberFormat("default");
  }
  return new Intl.NumberFormat("default", {
    minimumFractionDigits: Math.min(Math.max(0, digits), MAX_FRACTION_DIGITS),
    maximumFractionDigits: Math.min(Math.max(0, digits), MAX_FRACTION_DIGITS),
  });
});

export const getDecimalSeparator = memoize(
  () =>
    getNumberFormat(1)
      .formatToParts(1.1)
      .find((part) => part.type === "decimal")?.value,
);

/** formatNumber will format the number with fixed decimals
 * @param rawValue - should be a number that is not outside the safe range fail as in https://mikemcl.github.io/bignumber.js/#toN
 * @param formatDecimals - number of decimals to use
 */
export const formatNumber = (
  rawValue: string | number | BigNumber,
  formatDecimals = 0,
) => {
  return getNumberFormat(formatDecimals).format(Number(rawValue));
};

/** formatNumberFixed will format the number with fixed decimals
 * @param rawValue - should be a number that is not outside the safe range fail as in https://mikemcl.github.io/bignumber.js/#toN
 * @param formatDecimals - number of decimals to use
 */
export const formatNumberFixed = (
  rawValue: string | number | BigNumber,
  formatDecimals = 0,
) => {
  return getFixedNumberFormat(formatDecimals).format(Number(rawValue));
};

export const addDecimalsFormatNumber = (
  rawValue: string | number,
  decimalPlaces: number,
  formatDecimals: number = decimalPlaces,
) => {
  const x = addDecimal(rawValue, decimalPlaces);

  return formatNumber(x, formatDecimals);
};

export const addDecimalsFixedFormatNumber = (
  rawValue: string | number,
  decimalPlaces: number,
  formatDecimals: number = decimalPlaces,
) => {
  const x = addDecimal(rawValue, decimalPlaces);

  return formatNumberFixed(x, formatDecimals);
};

export const formatNumberPercentage = (value: BigNumber, decimals?: number) => {
  const decimalPlaces =
    typeof decimals === "undefined" ? Math.max(value.dp() || 0, 2) : decimals;
  return `${formatNumber(value, decimalPlaces)}%`;
};

export const toNumberParts = (
  value: BigNumber | null | undefined,
  decimals = 18,
): [integers: string, decimalPlaces: string] => {
  if (!value) {
    return ["0", "0".repeat(decimals)];
  }
  const separator = getDecimalSeparator() || ".";
  const [integers, decimalsPlaces] = formatNumber(value, decimals)
    .toString()
    .split(separator);
  return [integers, decimalsPlaces || ""];
};

export const useNumberParts = (
  value: BigNumber | null | undefined,
  decimals: number,
): [integers: string, decimalPlaces: string] => {
  return useMemo(() => toNumberParts(value, decimals), [decimals, value]);
};

export const isNumeric = (
  value?: string | number | BigNumber | bigint | null,
): value is NonNullable<number | string> => /^-?\d*\.?\d+$/.test(String(value));

const INFINITY = "∞";
const DEFAULT_COMPACT_ABOVE = 1_000_000;
const DEFAULT_COMPACT_CAP = new BigNumber(1e24);
/**
 * Compacts given number to human readable format.
 * @param number
 * @param decimals Number of decimal places
 * @param compactDisplay Display mode; short -> 1e6 == 1M; ling -> 1e6 1 million
 * @param compactAbove Compact number above threshold
 * @param cap Use scientific notation above threshold
 */
export const compactNumber = (
  number: BigNumber,
  decimals: number | "infer" = "infer",
  compactDisplay: "short" | "long" = "short",
  compactAbove = DEFAULT_COMPACT_ABOVE,
  cap = DEFAULT_COMPACT_CAP,
) => {
  if (!number.isFinite()) return `${number.isNegative() ? "-" : ""}${INFINITY}`;

  const decimalPlaces =
    (decimals === "infer" ? number.decimalPlaces() : decimals) || 0;

  if (number.isLessThan(DEFAULT_COMPACT_ABOVE)) {
    return formatNumber(number, decimalPlaces);
  }

  /**
   * Note: it compacts number up to 1_000_000_000_000 (1e12) -> 1T, all above is formatted as iteration of T.
   * Example: 1.579208923731619e59 -> 157,920,892,373,161,900,000,000,000,000,000,000,000,000,000,000T
   */
  const compactNumFormat = new Intl.NumberFormat("default", {
    minimumFractionDigits: Math.max(0, decimalPlaces),
    maximumFractionDigits: Math.max(0, decimalPlaces),
    notation: "compact",
    compactDisplay,
  });
  const scientificNumFormat = new Intl.NumberFormat("default", {
    minimumFractionDigits: Math.max(0, decimalPlaces),
    maximumFractionDigits: Math.max(0, decimalPlaces),
    notation: "scientific",
  });

  if (number.isGreaterThan(DEFAULT_COMPACT_CAP)) {
    const r = /E(\d+)$/i;
    const formatted = scientificNumFormat.format(Number(number));
    const eNotation = formatted.match(r);
    if (eNotation && eNotation.length > 1) {
      const power = eNotation[1];
      return (
        <span>
          {formatted.replace(r, "")}{" "}
          <span>
            &times; 10
            <sup>{power}</sup>
          </span>
        </span>
      );
    }
  }

  return compactNumFormat.format(Number(number));
};
