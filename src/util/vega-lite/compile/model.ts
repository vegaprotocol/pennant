import { Data } from "../data";
import { BaseSpec } from "../spec";
import { Transform } from "../transform";
import { DataComponent } from "./data";
import { parseData } from "./data/parse";

export interface Component {
  data: DataComponent;
}

export class Model {
  public readonly data: Data | null;
  public readonly transforms: Transform[];
  public readonly component: Component;
  public readonly children: Model[] = [];

  constructor(
    spec: BaseSpec,
    public readonly parent: Model | null,
  ) {
    this.data = spec.data ?? null;
    this.transforms = spec.transform ?? [];

    this.component = {
      data: {
        outputNodes: parent ? parent.component.data.outputNodes : {},
      },
    };
  }

  public parse() {
    this.parseData();
  }

  public parseData() {
    this.component.data = parseData(this);
  }
}
