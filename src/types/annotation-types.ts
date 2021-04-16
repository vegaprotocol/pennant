export declare const Intent: {
  NONE: "none";
  PRIMARY: "primary";
  SUCCESS: "success";
  WARNING: "warning";
  DANGER: "danger";
};

export type Intent = typeof Intent[keyof typeof Intent];

export type LabelAnnotation = {
  type: "label";
  id: string;
  cells: {
    label: string;
    stroke?: boolean;
    fill?: boolean;
    onClick?: () => void;
  }[];
  intent: Intent;
  y: number;
};

export type Annotation = LabelAnnotation;
