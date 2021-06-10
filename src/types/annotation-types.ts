import { Intent } from ".";

export type LabelAnnotationCell = {
  label: string;
  stroke?: boolean;
  fill?: boolean;
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
