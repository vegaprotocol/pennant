import type { InteractionTrackingData } from "./interaction-tracking-data";

export type Cursor =
  | "auto"
  | "default"
  | "none"
  | "context-menu"
  | "help"
  | "pointer"
  | "progress"
  | "wait"
  | "cell"
  | "crosshair"
  | "text"
  | "vertical-text"
  | "alias"
  | "copy"
  | "move"
  | "no-drop"
  | "not-allowed"
  | "e-resize"
  | "n-resize"
  | "ne-resize"
  | "nw-resize"
  | "s-resize"
  | "se-resize"
  | "sw-resize"
  | "w-resize"
  | "ns-resize"
  | "ew-resize"
  | "nesw-resize"
  | "col-resize"
  | "nwse-resize"
  | "row-resize"
  | "all-scroll"
  | "zoom-in"
  | "zoom-out"
  | "grab"
  | "grabbing";

interface HitArea {
  contains(x: number, y: number): boolean;
}

export interface InteractiveTarget {
  interactive: boolean;
  interactiveChildren: boolean;
  hitArea: HitArea;
  cursor: Cursor | string;
  buttonMode: boolean;
  trackedPointers: { [x: number]: InteractionTrackingData };
  _trackedPointers: { [x: number]: InteractionTrackingData };
}
