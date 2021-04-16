import { Data } from "../../data";
import { DataFlowNode } from "./dataflow";

export class SourceNode extends DataFlowNode {
  private _data: Data;

  constructor(data: Data) {
    super(null);
    this._data = { values: data.values };
  }

  public dependentFields() {
    return new Set<string>();
  }

  public producedFields() {
    return new Set<string>();
  }

  get data() {
    return this._data;
  }
}
