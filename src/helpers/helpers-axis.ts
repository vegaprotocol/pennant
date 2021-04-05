export function getNumXTicks(size: number): number {
  return Math.abs(size) / 100;
}

export function getNumYTicks(size: number): number {
  return Math.max(3, Math.abs(size) / 50);
}
