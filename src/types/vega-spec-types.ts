export type Mark = "rule" | "bar" | "candle";

export type Channel = {
  field: string;
  type: string;
};

export type ColorDef = {
  condition: {
    test: string[];
    value: string;
  };
  value: string;
};

export type Encoding = {
  x?: any;
  y?: any;
  y2?: any;
  color?: ColorDef;
  fill?: ColorDef;
  stroke?: ColorDef;
};

export type View = {
  name: string;
  mark?: Mark;
  encoding: Encoding;
  layer?: View[];
};
