export const Interval = {
  I1M: "I1M",
  I5M: "I5M",
  I15M: "I15M",
  I1H: "I1H",
  I6H: "I6H",
  I1D: "I1D",
} as const;

export type Interval = (typeof Interval)[keyof typeof Interval];

export const intervalLabels: Record<Interval, string> = {
  I1M: "1m",
  I5M: "5m",
  I15M: "15m",
  I1H: "1H",
  I6H: "6H",
  I1D: "1D",
} as const;
