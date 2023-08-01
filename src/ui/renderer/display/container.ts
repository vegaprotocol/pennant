import { Renderer } from "../core";
import { RenderableObject } from "../core/renderable-object";
import { Graphics } from "../graphics";
import { Rectangle } from "../math";
import { removeItems } from "../utils";
import { DisplayObject } from "./display-object";

/**
 * Container is a general-purpose display object that holds children.
 * It also adds built-in support for advanced rendering features like masking and filtering.
 */
export class Container extends DisplayObject implements RenderableObject {
  /**
   * The array of children of this container.
   */
  public readonly children: DisplayObject[] = [];

  public parent: Container | null = null;

  constructor() {
    super();
  }

  /**
   * Recalculates the bounds of the container.
   */
  public calculateBounds(): void {
    this._bounds.clear();

    this._calculateBounds();

    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i];

      if (!child.visible) {
        continue;
      }

      child.calculateBounds();

      this._bounds.addBounds(child._bounds);
    }

    this._bounds.updateID = this._boundsID;
  }

  /**
   * Adds one or more children to the container.
   *
   * Multiple items can be added like so: `myContainer.addChild(thingOne, thingTwo, thingThree)`
   */
  public addChild<T extends DisplayObject[]>(...children: T): T[0] {
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
   */
  public removeChild<T extends DisplayObject[]>(...children: T): T[0] | null {
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

  /**
   * Removes all children from this container that are within the begin and end indexes.
   */
  public removeChildren(
    beginIndex = 0,
    endIndex = this.children.length,
  ): DisplayObject[] {
    const begin = beginIndex;
    const end = endIndex;
    const range = end - begin;
    let removed;

    if (range > 0 && range <= end) {
      removed = this.children.splice(begin, range);

      for (let i = 0; i < removed.length; ++i) {
        removed[i].parent = null;
      }

      this._boundsID++;

      return removed;
    } else if (range === 0 && this.children.length === 0) {
      return [];
    }

    throw new RangeError(
      "removeChildren: numeric values are outside the acceptable range.",
    );
  }

  public render(renderer: Renderer): void {
    if (!this.visible) {
      return;
    }

    if (this._mask) {
      renderer.mask?.pushMask(this._mask as Graphics);
    }

    this._render(renderer);

    for (let i = 0, j = this.children.length; i < j; ++i) {
      this.children[i].render(renderer);
    }

    if (this._mask) {
      renderer.mask?.popMask(renderer);
    }
  }

  /**
   * Updates the transform on all children of this container for rendering.
   */
  public updateTransform(): void {
    if (this.parent) {
      this.transform.updateTransform(this.parent.transform);
    }

    for (let i = 0, j = this.children.length; i < j; ++i) {
      const child = this.children[i];

      if (child.visible) {
        child.updateTransform();
      }
    }
  }

  /**
   * Retrieves the local bounds of the displayObject as a rectangle object.
   */
  public getLocalBounds(
    rect?: Rectangle,
    skipChildrenUpdate = false,
  ): Rectangle {
    const result = super.getLocalBounds(rect);

    if (!skipChildrenUpdate) {
      for (let i = 0, j = this.children.length; i < j; ++i) {
        const child = this.children[i];

        if (child.visible) {
          child.updateTransform();
        }
      }
    }

    return result;
  }

  destroy(): void {
    super.destroy();

    const oldChildren = this.removeChildren(0, this.children.length);

    for (let i = 0; i < oldChildren.length; ++i) {
      oldChildren[i].destroy();
    }
  }

  protected _render(_renderer: Renderer): void {}
  protected _calculateBounds(): void {}
}
