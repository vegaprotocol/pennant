import { Line } from "./shapes/line";
import { Rectangle } from "./shapes/rectangle";

export * from "./const";
export * from "./matrix";
export * from "./point";
export * from "./transform";

export { Rectangle };
export { Line };

export type Shape = Line | Rectangle;
