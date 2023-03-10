export function isDate(arr: any): arr is Date {
  return arr instanceof Date;
}

export function isDateArray(arr: any[]): arr is Date[] {
  return arr[0] instanceof Date;
}
