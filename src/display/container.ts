import { CanvasRenderer } from "../renderer";
import { DisplayObject } from ".";

/**
 * Remove items from a javascript array without generating garbage
 *
 * @param arr - Array to remove elements from
 * @param startIdx - starting index
 * @param removeCount - how many to remove
 */
export function removeItems(
  arr: any[],
  startIdx: number,
  removeCount: number
): void {
  const length = arr.length;
  let i;

  if (startIdx >= length || removeCount === 0) {
    return;
  }

  removeCount =
    startIdx + removeCount > length ? length - startIdx : removeCount;

  const len = length - removeCount;

  for (i = startIdx; i < len; ++i) {
    arr[i] = arr[i + removeCount];
  }

  arr.length = len;
}

/**
 * Container is a general-purpose display object that holds children.
 */
export class Container extends DisplayObject {
  /**
   * The array of children of this container.
   */
  public readonly children: DisplayObject[] = [];

  constructor() {
    super();
  }

  /**
   * Adds one or more children to the container.
   *
   * Multiple items can be added like so: `myContainer.addChild(thingOne, thingTwo, thingThree)`
   *
   * @param children - The DisplayObject(s) to add to the container
   * @return The first child that was added.
   */
  addChild<T extends DisplayObject[]>(...children: T): T[0] {
    if (children.length > 1) {
      for (let i = 0; i < children.length; i++) {
        this.addChild(children[i]);
      }
    } else {
      const child = children[0];

      if (child.parent) {
        child.parent.removeChild(child);
      }

      child.parent = this;

      this.children.push(child);
    }

    return children[0];
  }

  /**
   * Removes one or more children from the container.
   *
   * @param children - The DisplayObject(s) to remove
   * @return The first child that was removed.
   */
  removeChild<T extends DisplayObject[]>(...children: T): T[0] | null {
    if (children.length > 1) {
      for (let i = 0; i < children.length; i++) {
        this.removeChild(children[i]);
      }
    } else {
      const child = children[0];
      const index = this.children.indexOf(child);

      if (index === -1) {
        return null;
      }

      child.parent = null;
      removeItems(this.children, index, 1);
    }

    return children[0];
  }

  render(renderer: CanvasRenderer): void {
    this._render(renderer);

    for (const child of this.children) {
      child.render(renderer);
    }
  }

  /**
   * To be overridden by subclasses.
   *
   * @param _renderer - The renderer
   */
  protected _render(_renderer: CanvasRenderer): void {}
}
