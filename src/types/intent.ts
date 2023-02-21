/**
 * The five basic intents.
 */
export const Intent = {
  NONE: "none",
  PRIMARY: "primary",
  SUCCESS: "success",
  WARNING: "warning",
  DANGER: "danger",
} as const;

export type Intent = (typeof Intent)[keyof typeof Intent];
