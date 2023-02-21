import { OutputNode } from "./dataflow";
export { OutputNode } from "./dataflow";
export { TechnicalIndicatorTransformNode } from "./technical-indicator";

export interface DataComponent {
  outputNodes: Record<string, OutputNode>;
}
