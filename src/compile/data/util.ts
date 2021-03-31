import { DataFlowNode } from "./dataflow";

export class PlaceholderDataFlowNode extends DataFlowNode {
  public dependentFields() {
    return new Set<string>();
  }

  public producedFields() {
    return new Set<string>();
  }
}
