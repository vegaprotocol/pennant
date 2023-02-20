import { InlineDataset } from "../data";
import { BaseSpec } from "./base";

export type Datasets = Record<string, InlineDataset>;

export type TopLevel<S extends BaseSpec> = S & {
  datasets?: Datasets;
};
