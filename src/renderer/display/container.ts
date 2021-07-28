import { Renderer } from "../core";
import {
  RenderableContainer,
  RenderableObject,
} from "../core/renderable-object";
import { Rectangle } from "../math";
import { removeItems } from "../utils";
import { DisplayObject } from "./display-object";

export class Container extends DisplayObject implements RenderableObject {
  public readonly children: DisplayObject[] = [];
  public parent: Container | null = null;

  constructor() {
    super();
  }

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

  public removeChildren(
    beginIndex = 0,
    endIndex = this.children.length
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
      "removeChildren: numeric values are outside the acceptable range."
    );
  }

  public render(renderer: Renderer): void {
    if (!this.visible) {
      return;
    }

    this._render(renderer);

    for (let i = 0, j = this.children.length; i < j; ++i) {
      this.children[i].render(renderer);
    }
  }

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

  public getLocalBounds(
    rect?: Rectangle,
    skipChildrenUpdate = false
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
