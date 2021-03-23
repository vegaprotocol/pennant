/**
 * Merges two arrays
 * @param a First array. Takes precedence
 * @param b Second array
 * @returns Merged array
 */
export function mergeData(
  a: { date: Date; datetime: string }[],
  b: { date: Date; datetime: string }[]
) {
  let i = 0;
  let j = 0;

  const mergedArray = [];

  while (i < a.length && j < b.length) {
    if (a[i].date < b[j].date) {
      mergedArray.push(a[i++]);
    } else if (a[i].date > b[j].date) {
      mergedArray.push(b[j++]);
    } else {
      mergedArray.push(a[i++]);
      j++;
    }
  }

  while (i < a.length) {
    mergedArray.push(a[i++]);
  }

  while (j < b.length) {
    mergedArray.push(b[j++]);
  }

  return mergedArray;
}
