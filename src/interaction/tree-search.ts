import { Container, DisplayObject } from "../display";
import { InteractionEvent } from ".";

export class TreeSearch {
  public recursiveFindHit(
    interactionEvent: InteractionEvent,
    displayObject: DisplayObject,
    hitTest: boolean
  ): boolean {
    console.log("recursiveFindHit");
    if (!displayObject) {
      return false;
    }

    const interactive = displayObject.interactive;

    const point = interactionEvent.data.global;

    let hit = false;

    if ((displayObject as Container).children) {
      const children = (displayObject as Container).children;

      console.log(children);

      for (const child of children) {
        const childHit = this.recursiveFindHit(
          interactionEvent,
          child,
          hitTest
        );

        if (childHit) {
          if (interactionEvent.target) {
            hitTest = false;
          }
          hit = true;
        }
      }
    }

    if (interactive) {
      if (hitTest && !interactionEvent.target) {
        if ((displayObject as any).containsPoint) {
          if ((displayObject as any).containsPoint(point)) {
            hit = true;
          }
        }
      }

      if (hit && !interactionEvent.target) {
        interactionEvent.target = displayObject;
      }
    }

    return hit;
  }

  public findHit(
    interactionEvent: InteractionEvent,
    displayObject: DisplayObject
  ): void {
    this.recursiveFindHit(interactionEvent, displayObject, true);
  }
}
