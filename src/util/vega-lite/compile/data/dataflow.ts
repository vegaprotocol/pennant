export abstract class DataFlowNode {
  private _children: DataFlowNode[] = [];
  private _parent: DataFlowNode | null = null;

  constructor(parent: DataFlowNode | null) {
    if (parent) {
      this.parent = parent;
    }
  }

  public abstract dependentFields(): Set<string>;
  public abstract producedFields(): Set<string>;

  get parent() {
    return this._parent;
  }

  set parent(parent: DataFlowNode | null) {
    this._parent = parent;

    if (parent) {
      parent.addChild(this);
    }
  }

  get children() {
    return this._children;
  }

  public addChild(child: DataFlowNode, loc?: number) {
    // Do not add the same child twice
    if (this._children.includes(child)) {
      return;
    }

    this._children.push(child);
  }
}

export class OutputNode extends DataFlowNode {
  public dependentFields() {
    return new Set<string>();
  }

  public producedFields() {
    return new Set<string>();
  }
}
