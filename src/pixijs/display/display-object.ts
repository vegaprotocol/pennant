import { Renderer } from "../core";
import { Point, Transform } from "../math";
import { Container } from "./container";

export abstract class DisplayObject {
  public parent: DisplayObject | null;
  public transform: Transform;
  public visible: boolean;

  constructor() {
    this.parent = null;
    this.transform = new Transform();
    this.visible = true;
  }

  abstract removeChild(child: DisplayObject): void;
  abstract render(renderer: Renderer): void;

  setParent(container: Container): Container {
    if (!container || !container.addChild) {
      throw new Error("setParent: Argument must be a Container");
    }

    container.addChild(this);

    return container;
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

  get scale(): Point {
    return this.transform.scale;
  }

  set scale(value: Point) {
    this.transform.scale.copyFrom(value);
  }
}
