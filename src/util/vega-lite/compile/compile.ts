import { BaseSpec } from "../spec/base";
import { buildModel } from "./buildModel";
import { Model } from "./model";

export function compile(inputSpec: BaseSpec) {
  const model: Model = buildModel(inputSpec, null);

  model.parse();

  return model;

  /* const scenegraph = assembleModel(model);

     return scenegraph; */
}
