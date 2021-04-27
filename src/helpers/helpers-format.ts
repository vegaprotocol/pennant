export const formatter = (value: number, significantFigures: number = 5) =>
  new Intl.NumberFormat("en-GB", {
    maximumSignificantDigits: significantFigures,
    minimumSignificantDigits: significantFigures,
  }).format(value);
