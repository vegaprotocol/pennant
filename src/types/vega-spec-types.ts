import { Mark, MarkDef } from "../mark";

import { Data } from "../data";
import { Encoding } from "../encoding";
import { Field } from "../channeldef";
import { Transform } from "../transform";

export type View = {
  data?: Data;
  name?: string;
  mark?: Mark | MarkDef;
  encoding?: Encoding<Field>;
  layer?: View[];
  transform?: Transform[];
};
