import { ColorDef, Field, NumericDef, PositionDef } from "./channeldef";

export interface Encoding<F extends Field> {
  x?: PositionDef<F>;
  y?: PositionDef<F>;
  x2?: PositionDef<F>;
  y2?: PositionDef<F>;
  color?: ColorDef<F>;
  fill?: ColorDef<F>;
  stroke?: ColorDef<F>;
  strokeWidth?: NumericDef<F>;
}
