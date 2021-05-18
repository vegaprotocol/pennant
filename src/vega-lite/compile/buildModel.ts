import { BaseSpec } from "../spec/base";
import { Model } from "./model";

export function buildModel(spec: BaseSpec, parent: Model | null) {
  return new Model(spec, parent);
}
