import { Renderer } from "../core";
import { removeItems } from "../utils";
import { DisplayObject } from "./display-object";

export class Container extends DisplayObject {
  public readonly children: DisplayObject[] = [];
  public parent: Container | null = null;

  constructor() {
    super();
  }

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

  render(renderer: Renderer): void {
    if (!this.visible) {
      return;
    }

    this._render(renderer);

    for (let i = 0, j = this.children.length; i < j; ++i) {
      this.children[i].render(renderer);
    }
  }

  protected _render(_renderer: Renderer): void {}
}
