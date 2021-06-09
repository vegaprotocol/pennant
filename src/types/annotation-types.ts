export declare const Intent: {
  NONE: "none";
  PRIMARY: "primary";
  SUCCESS: "success";
  WARNING: "warning";
  DANGER: "danger";
};

export type Intent = typeof Intent[keyof typeof Intent];

export type LabelAnnotationCell = {
  label: string;
  stroke?: boolean;
  fill?: boolean;
  intent?: Intent; // override annotation intent for this cell
  onClick?: () => void;
  spinner?: boolean;
};

export type LabelAnnotation = {
  type: "label";
  id: string;
  cells: LabelAnnotationCell[];
  intent: Intent;
  y: number;
};

export type Annotation = LabelAnnotation;
