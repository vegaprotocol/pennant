import { BaseSpec } from "./base";
import { GenericVConcatSpec } from "./concat";
import { TopLevel } from "./toplevel";

export type { BaseSpec } from "./base";
export { isVConcatSpec } from "./concat";

export type TopLevelSpec =
  | TopLevel<BaseSpec>
  | TopLevel<GenericVConcatSpec<BaseSpec>>;
