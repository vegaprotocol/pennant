/**
 * Checks if `string` ends with the given target string.
 */
export function endsWith(string: string, target: string): boolean {
  const length = string.length;

  const position = length - target.length;

  return position >= 0 && string.slice(position, length) === target;
}

export function string2num(string: string, fallback = 1) {
  let width = fallback;

  if (endsWith(string, "px")) {
    width = Number(string.slice(0, -2));
  } else if (typeof Number.parseFloat(string) === "number") {
    width = Number.parseFloat(string);
  }

  return width;
}
