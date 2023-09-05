export function calculatePreferredSize(
  size: number | string | undefined,
  defaultStudySize: number | string,
  n: number,
  main: boolean,
) {
  // main will always be greedy thanks to LayoutPriority.High
  // and 100% preferred size
  if (main) {
    return "100%";
  }

  if (size !== undefined) {
    return size;
  }

  // use default studySize
  if (typeof defaultStudySize === "string") {
    const preferredSize = defaultStudySize.trim();

    if (preferredSize.endsWith("%")) {
      const proportion = Number(preferredSize.slice(0, -1)) / 100;

      const ratio = 1 / proportion;

      const mainSize = ratio / (ratio + (n - 1));

      const pctValue = 100 * ((1 - mainSize) / Math.max(n - 1, 1));

      return `${pctValue}%`;
    } else if (preferredSize.endsWith("px")) {
      return Number(preferredSize.slice(0, -2));
    } else if (typeof Number.parseFloat(preferredSize) === "number") {
      return Number.parseFloat(preferredSize);
    }
  } else {
    return defaultStudySize;
  }
}
