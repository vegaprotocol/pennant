export type Mark = "bar" | "line" | "rule";

export type Channel = {
  field: string;
  type: string;
};

export type ColorDef = {
  condition?: {
    test: string[];
    value: string;
  };
  value: string;
};

export interface ValueRef {
  datum?: any;
  field?: string;
  scale?: {
    zero: boolean;
  };
  type?: "ordinal" | "temporal" | "quantitative";
}

export interface EncodeEntry {
  x?: ValueRef;
  y?: ValueRef;
  y2?: ValueRef;
  color?: ColorDef;
  fill?: ColorDef;
  stroke?: ColorDef;
}

export interface Data {
  values?: any[];
}

export interface Layer {}

export type View = {
  data?: Data;
  name?: string;
  mark?: Mark;
  encoding?: EncodeEntry;
  layer?: View[];
};
