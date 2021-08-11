import { DisplayObject } from "../display";
import { Point } from "../math";
import { PennantPointerEvent } from "./interaction-manager";

export type InteractivePointerEvent =
  | PointerEvent
  | TouchEvent
  | MouseEvent
  | WheelEvent;

export class InteractionData {
  public button: number = 0;
  public global: Point;
  public identifier: number | null;
  public target: DisplayObject | null;
  public originalEvent: InteractivePointerEvent | null = null;
  public pointerType: string | null = null;

  constructor() {
    this.global = new Point();
    this.identifier = null;
    this.target = null;
  }

  public copyEvent(event: Touch | PennantPointerEvent): void {
    if ("pointerType" in event) {
      this.pointerType = event.pointerType;
    }
  }

  public reset(): void {}
}
