import { Candle } from "@util/types";

/**
 * Merges two arrays
 * @param a First array. Takes precedence
 * @param b Second array
 * @returns Merged array
 */
export function mergeData(a: readonly Candle[], b: readonly Candle[]) {
  let i = 0;
  let j = 0;

  const sortedA = [...a].sort((a, b) => a.date.getTime() - b.date.getTime());
  const sortedB = [...b].sort((a, b) => a.date.getTime() - b.date.getTime());

  const mergedArray = [];

  while (i < sortedA.length && j < sortedB.length) {
    if (sortedA[i].date < sortedB[j].date) {
      mergedArray.push(sortedA[i++]);
    } else if (sortedA[i].date > sortedB[j].date) {
      mergedArray.push(sortedB[j++]);
    } else {
      mergedArray.push(sortedA[i++]);
      j++;
    }
  }

  while (i < sortedA.length) {
    mergedArray.push(sortedA[i++]);
  }

  while (j < sortedB.length) {
    mergedArray.push(sortedB[j++]);
  }

  return mergedArray;
}
