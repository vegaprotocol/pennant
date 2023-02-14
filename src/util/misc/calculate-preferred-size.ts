export function calculatePreferredSize(
  studySize: number | string,
  n: number,
  main: boolean
) {
  if (typeof studySize === "string") {
    const preferredSize = studySize.trim();

    if (preferredSize.endsWith("%")) {
      const proportion = Number(preferredSize.slice(0, -1)) / 100;

      const ratio = 1 / proportion;

      const mainSize = ratio / (ratio + (n - 1));

      if (main) {
        return `${100 * mainSize}%`;
      } else {
        return `${100 * ((1 - mainSize) / Math.max(n - 1, 1))}%`;
      }
    } else if (preferredSize.endsWith("px")) {
      const pixels = Number(preferredSize.slice(0, -2));

      if (main) {
        return undefined;
      } else {
        return pixels;
      }
    } else if (typeof Number.parseFloat(preferredSize) === "number") {
      const pixels = Number.parseFloat(preferredSize);

      if (main) {
        return undefined;
      } else {
        return pixels;
      }
    }
  } else {
    const pixels = studySize;

    if (main) {
      return undefined;
    } else {
      return pixels;
    }
  }
}
