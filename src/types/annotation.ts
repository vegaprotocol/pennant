import { Intent } from ".";

export type LabelAnnotationCell = {
  label: string;
  stroke?: boolean;
  fill?: boolean;
  intent?: Intent; // override annotation intent for this cell
  spinner?: boolean;
  onClick?: () => void;
};

export type LabelAnnotation = {
  type: "label";
  id: string;
  cells: LabelAnnotationCell[];
  intent: Intent;
  y: number;
};

export type Annotation = LabelAnnotation;
