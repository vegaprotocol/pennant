import { DisplayObject } from "../display";
import { InteractionData } from "./interaction-data";

export type InteractionCallback = (
  interactionEvent: InteractionEvent,
  displayObject: DisplayObject,
  hit?: boolean,
) => void;

export class InteractionEvent {
  public stopped: boolean;
  public stopsPropagatingAt: DisplayObject | null;
  public stopPropagationHint: boolean;
  public target: DisplayObject | null;
  public currentTarget: DisplayObject | null;
  public type: string | null;
  public data: InteractionData | null;

  constructor() {
    this.stopped = false;
    this.stopsPropagatingAt = null;
    this.stopPropagationHint = false;
    this.target = null;
    this.currentTarget = null;
    this.type = null;
    this.data = null;
  }

  public stopPropagation(): void {
    this.stopped = true;
    this.stopPropagationHint = true;
    this.stopsPropagatingAt = this.currentTarget;
  }

  public reset(): void {
    this.stopped = false;
    this.stopsPropagatingAt = null;
    this.stopPropagationHint = false;
    this.currentTarget = null;
    this.target = null;
  }
}
