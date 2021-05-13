import { ColorDef, Field } from "./channeldef";

export const Mark = {
  area: "area",
  bar: "bar",
  line: "line",
  rule: "rule",
} as const;

export type Mark = keyof typeof Mark;

export type Color = string;

export type BaseValueRef<T> =
  | {
      value: T | null;
    }
  | {
      field: Field;
    };

export interface BaseGradient {
  gradient: "linear";
}

export interface GradientStop {
  offset: number;
  color: Color;
}

export type Gradient = LinearGradient;

export interface LinearGradient extends BaseGradient {
  gradient: "linear";
  stops: GradientStop[];
}

export type ColorValueRef =
  | BaseValueRef<Color>
  | { value: LinearGradient }
  | {
      gradient: Field;
      start?: number[];
      stop?: number[];
      count?: number;
    }
  | {
      color: Color;
    };

export interface MarkDef {
  type: string | Mark;
  orient?: "left" | "right";
  line?: { color: Color };
  color?: Color | Gradient;
}
