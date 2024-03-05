export const Interval = {
  I1M: "I1M",
  I5M: "I5M",
  I15M: "I15M",
  I30M: "I30M",
  I1H: "I1H",
  I4H: "I4H",
  I6H: "I6H",
  I8H: "I8H",
  I12H: "I12H",
  I1D: "I1D",
  I7D: "I7D",
} as const;

export type Interval = (typeof Interval)[keyof typeof Interval];

export const intervalLabels: Record<Interval, string> = {
  I1M: "1m",
  I5M: "5m",
  I15M: "15m",
  I30M: "30m",
  I1H: "1h",
  I4H: "4h",
  I6H: "6h",
  I8H: "8h",
  I12H: "12h",
  I1D: "D",
  I7D: "W",
} as const;
