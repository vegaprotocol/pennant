import { Model } from "./model";
import { BaseSpec } from "../spec/base";

export function buildModel(spec: BaseSpec, parent: Model | null) {
  return new Model(spec, parent);
}
