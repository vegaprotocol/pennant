import { Data } from "../data";
import { Encoding } from "../encoding";
import { Mark, MarkDef } from "../mark";
import { Transform } from "../transform";

export interface Specification {
  data?: Data | null;
  encoding?: Encoding<any>;
  mark?: Mark | MarkDef;

  /**
   * Name for later reference
   */
  name?: string;
  layer?: Specification[];
  transform?: Transform[];
}
