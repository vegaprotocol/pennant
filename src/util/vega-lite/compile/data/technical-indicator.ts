import { TechnicalIndicatorTransform } from "../../transform";
import { DataFlowNode } from "./dataflow";

export class TechnicalIndicatorTransformNode extends DataFlowNode {
  constructor(
    parent: DataFlowNode | null,
    private transform: TechnicalIndicatorTransform,
  ) {
    super(parent);
    this.transform = transform;
  }

  public dependentFields() {
    return new Set(this.transform.on);
  }

  public producedFields() {
    return new Set(this.transform.as);
  }

  public assemble() {
    const { indicator, on, as, ...rest } = this.transform;

    return {
      type: "technical-indicator",
      method: indicator,
      on: on,
      as: as,
    };
  }
}
