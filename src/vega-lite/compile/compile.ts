import { Model } from "./model";
import { BaseSpec } from "../spec/base";
import { buildModel } from "./buildModel";

export function compile(inputSpec: BaseSpec) {
  const model: Model = buildModel(inputSpec, null);

  model.parse();

  return model;

  /* const scenegraph = assembleModel(model);

     return scenegraph; */
}
