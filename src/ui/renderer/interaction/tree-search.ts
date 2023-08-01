import { Container, DisplayObject } from "../display";
import { Point } from "../math";
import { InteractionCallback, InteractionEvent } from "./interaction-event";

/**
 * Strategy how to search through stage tree for interactive objects
 */
export class TreeSearch {
  private readonly _tempPoint: Point;

  constructor() {
    this._tempPoint = new Point();
  }

  public recursiveFindHit(
    interactionEvent: InteractionEvent,
    displayObject: DisplayObject,
    func?: InteractionCallback,
    hitTest?: boolean,
    interactive?: boolean,
  ): boolean {
    if (!displayObject || !displayObject.visible || !interactionEvent.data) {
      return false;
    }

    const point = interactionEvent.data.global;

    interactive = displayObject.interactive || interactive;

    let hit = false;
    let interactiveParent = interactive;

    let hitTestChildren = true;

    // If there is a hitArea, no need to test against anything else if the pointer is not within the hitArea
    // There is also no longer a need to hitTest children.
    if (displayObject.hitArea) {
      if (hitTest) {
        displayObject.worldTransform.applyInverse(point, this._tempPoint);

        if (
          !displayObject.hitArea.contains(this._tempPoint.x, this._tempPoint.y)
        ) {
          hitTest = false;
          hitTestChildren = false;
        } else {
          hit = true;
        }
      }

      interactiveParent = false;
    }

    if (
      hitTestChildren &&
      displayObject.interactiveChildren &&
      (displayObject as Container).children
    ) {
      const children = (displayObject as Container).children;

      for (let i = children.length - 1; i >= 0; i--) {
        const child = children[i];

        // time to get recursive.. if this function will return if something is hit..
        const childHit = this.recursiveFindHit(
          interactionEvent,
          child,
          func,
          hitTest,
          interactiveParent,
        );

        if (childHit) {
          // its a good idea to check if a child has lost its parent.
          // this means it has been removed whilst looping so its best
          if (!child.parent) {
            continue;
          }

          // we no longer need to hit test any more objects in this container as we we
          // now know the parent has been hit
          interactiveParent = false;

          // If the child is interactive , that means that the object hit was actually
          // interactive and not just the child of an interactive object.
          // This means we no longer need to hit test anything else. We still need to run
          // through all objects, but we don't need to perform any hit tests.

          if (childHit) {
            if (interactionEvent.target) {
              hitTest = false;
            }
            hit = true;
          }
        }
      }
    }

    // no point running this if the item is not interactive or does not have an interactive parent.
    if (interactive) {
      // if we are hit testing (as in we have no hit any objects yet)
      // We also don't need to worry about hit testing if once of the displayObjects children
      // has already been hit - but only if it was interactive, otherwise we need to keep
      // looking for an interactive child, just in case we hit one
      if (hitTest && !interactionEvent.target) {
        // already tested against hitArea if it is defined
        if (!displayObject.hitArea && (displayObject as any).containsPoint) {
          if ((displayObject as any).containsPoint(point)) {
            hit = true;
          }
        }
      }

      if (displayObject.interactive) {
        if (hit && !interactionEvent.target) {
          interactionEvent.target = displayObject;
        }

        if (func) {
          func(interactionEvent, displayObject, !!hit);
        }
      }
    }

    return hit;
  }

  public findHit(
    interactionEvent: InteractionEvent,
    displayObject: DisplayObject,
    func?: InteractionCallback,
    hitTest?: boolean,
  ): boolean {
    return this.recursiveFindHit(
      interactionEvent,
      displayObject,
      func,
      hitTest,
      false,
    );
  }
}
