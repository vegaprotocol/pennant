import { Model } from "./model";
import { Specification } from "../spec";

export function buildModel(spec: Specification, parent: Model | null) {
  return new Model(spec, parent);
}
