import { Data } from "../data";
import { Encoding } from "../encoding";
import { Mark } from "../mark";
import { Transform } from "../transform";

export interface Specification {
  data?: Data | null;
  mark: Mark;
  encoding?: Encoding<any>;
  transform?: Transform[];
}
