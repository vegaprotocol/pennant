import { Area } from "./shapes/area";
import { Circle } from "./shapes/circle";
import { Line } from "./shapes/line";
import { Polygon } from "./shapes/polygon";
import { Rectangle } from "./shapes/rectangle";

export * from "./const";
export * from "./matrix";
export * from "./point";
export * from "./transform";

export { Area };
export { Circle };
export { Line };
export { Polygon };
export { Rectangle };

export type Shape = Area | Circle | Line | Polygon | Rectangle;
