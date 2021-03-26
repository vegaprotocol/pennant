import { Model } from "./model";
import { Specification } from "../spec";
import { buildModel } from "./buildModel";

export function compile(inputSpec: Specification) {
  const model: Model = buildModel(inputSpec, null);

  model.parse();

  return model;

  /* const scenegraph = assembleModel(model);

     return scenegraph; */
}
