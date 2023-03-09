export function sign(n: number): -1 | 0 | 1 {
  if (n === 0) return 0;

  return n < 0 ? -1 : 1;
}
