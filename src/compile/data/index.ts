import { OutputNode } from "./dataflow";

export interface DataComponent {
  outputNodes: Record<string, OutputNode>;
}
