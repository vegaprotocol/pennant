export function getStudyInfoFieldValue(
  data: any[],
  index: number | null,
  id: string
): number {
  const length = data.length;

  if (length === 0) {
    return NaN;
  }

  if (index === null || index >= length || index < 0) {
    return data[length - 1][id];
  }

  return data[index][id];
}
