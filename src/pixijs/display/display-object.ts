import EventEmitter from "eventemitter3";

import { Renderer } from "../core";
import { Cursor, InteractionTrackingData } from "../interaction";
import { Matrix, Point, Rectangle, Transform } from "../math";
import { Bounds } from "./bounds";
import { Container } from "./container";

interface HitArea {
  contains(x: number, y: number): boolean;
}
export abstract class DisplayObject extends EventEmitter {
  public cursor: Cursor | string | null = null;
  public hitArea: HitArea | null;
  public interactive: boolean;
  public interactiveChildren: boolean;
  public parent: DisplayObject | null;
  public transform: Transform;
  public visible: boolean;
  public _trackedPointers: { [x: number]: InteractionTrackingData } | undefined;
  public _bounds: Bounds = new Bounds();
  public _localBounds: Bounds | null = null;

  protected _boundsID: number = 0;
  protected _boundsRect: Rectangle | null = null;
  protected _localBoundsRect: Rectangle | null = null;

  private tempDisplayObjectParent: TemporaryDisplayObject | null = null;

  constructor() {
    super();

    this.hitArea = null;
    this.interactive = false;
    this.interactiveChildren = true;
    this.parent = null;
    this.transform = new Transform();
    this.visible = true;
  }

  abstract calculateBounds(): void;
  abstract removeChild(child: DisplayObject): void;
  abstract render(renderer: Renderer): void;

  setParent(container: Container): Container {
    if (!container || !container.addChild) {
      throw new Error("setParent: Argument must be a Container");
    }

    container.addChild(this);

    return container;
  }

  updateTransform(): void {
    if (this.parent) {
      this.transform.updateTransform(this.parent.transform);
    }
  }

  getLocalBounds(rect?: Rectangle): Rectangle {
    if (!rect) {
      if (!this._localBoundsRect) {
        this._localBoundsRect = new Rectangle();
      }

      rect = this._localBoundsRect;
    }

    if (!this._localBounds) {
      this._localBounds = new Bounds();
    }

    const transformRef = this.transform;
    const parentRef = this.parent;

    this.parent = null;
    this.transform = this._tempDisplayObjectParent.transform;

    const worldBounds = this._bounds;
    const worldBoundsID = this._boundsID;

    this._bounds = this._localBounds;

    const bounds = this.getBounds(false, rect);

    this.parent = parentRef;
    this.transform = transformRef;

    this._bounds = worldBounds;
    this._bounds.updateID += this._boundsID - worldBoundsID; // reflect side-effects

    return bounds;
  }

  public getBounds(skipUpdate?: boolean, rect?: Rectangle): Rectangle {
    if (!skipUpdate) {
      if (!this.parent) {
        this.parent = this._tempDisplayObjectParent as unknown as Container;
        this.updateTransform();
        this.parent = null;
      } else {
        //this._recursivePostUpdateTransform(); // TODO: Do we need this?
        this.updateTransform();
      }
    }

    if (this._bounds.updateID !== this._boundsID) {
      this.calculateBounds();
      this._bounds.updateID = this._boundsID;
    }

    if (!rect) {
      if (!this._boundsRect) {
        this._boundsRect = new Rectangle();
      }

      rect = this._boundsRect;
    }

    return this._bounds.getRectangle(rect);
  }

  get _tempDisplayObjectParent(): TemporaryDisplayObject {
    if (this.tempDisplayObjectParent === null) {
      this.tempDisplayObjectParent = new TemporaryDisplayObject();
    }

    return this.tempDisplayObjectParent;
  }

  enableTempParent(): Container | null {
    const myParent = this.parent;

    this.parent = this._tempDisplayObjectParent as unknown as Container;

    return myParent as unknown as Container;
  }

  /**
   * Pair method for `enableTempParent`
   *
   * @param {PIXI.Container} cacheParent - Actual parent of element
   */
  disableTempParent(cacheParent: Container): void {
    this.parent = cacheParent;
  }

  get x(): number {
    return this.position.x;
  }

  set x(value: number) {
    this.transform.position.x = value;
  }

  get y(): number {
    return this.position.y;
  }

  set y(value: number) {
    this.transform.position.y = value;
  }

  get position(): Point {
    return this.transform.position;
  }

  set position(value: Point) {
    this.transform.position.copyFrom(value);
  }

  get rotation(): number {
    return this.transform.rotation;
  }

  set rotation(value: number) {
    this.transform.rotation = value;
  }

  get scale(): Point {
    return this.transform.scale;
  }

  set scale(value: Point) {
    this.transform.scale.copyFrom(value);
  }

  get trackedPointers() {
    if (this._trackedPointers === undefined) this._trackedPointers = {};

    return this._trackedPointers;
  }

  get worldTransform(): Matrix {
    return this.transform.worldTransform;
  }
}

export class TemporaryDisplayObject extends DisplayObject {
  calculateBounds() {
    return null;
  }

  removeChild(child: DisplayObject) {
    return null;
  }

  render(renderer: Renderer) {
    return null;
  }
}
