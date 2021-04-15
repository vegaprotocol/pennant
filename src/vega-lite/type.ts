export const Type = {
  quantitative: "quantitative",
  temporal: "temporal",
} as const;

export type Type = keyof typeof Type;
