import { Matrix } from "./matrix";
import { Point } from "./point";

export class Transform {
  public localTransform: Matrix;
  public pivot: Point;
  public position: Point;
  public scale: Point;
  public skew: Point;
  public worldTransform: Matrix;

  protected _rotation: number;
  protected _cx: number;
  protected _sx: number;
  protected _cy: number;
  protected _sy: number;

  constructor() {
    this.localTransform = new Matrix();
    this.pivot = new Point(0, 0);
    this.position = new Point(0, 0);
    this.scale = new Point(1, 1);
    this.skew = new Point(0, 0);
    this.worldTransform = new Matrix();

    this._rotation = 0;
    this._cx = 1;
    this._sx = 0;
    this._cy = 0;
    this._sy = 1;
  }

  updateLocalTransform(): void {
    const lt = this.localTransform;

    // get the matrix values of the displayobject based on its transform properties..
    lt.a = this._cx * this.scale.x;
    lt.b = this._sx * this.scale.x;
    lt.c = this._cy * this.scale.y;
    lt.d = this._sy * this.scale.y;

    lt.tx = this.position.x - (this.pivot.x * lt.a + this.pivot.y * lt.c);
    lt.ty = this.position.y - (this.pivot.x * lt.b + this.pivot.y * lt.d);
  }

  updateTransform(parentTransform: Transform): void {
    const lt = this.localTransform;

    lt.a = this._cx * this.scale.x;
    lt.b = this._sx * this.scale.x;
    lt.c = this._cy * this.scale.y;
    lt.d = this._sy * this.scale.y;

    lt.tx = this.position.x - (this.pivot.x * lt.a + this.pivot.y * lt.c);
    lt.ty = this.position.y - (this.pivot.x * lt.b + this.pivot.y * lt.d);

    const pt = parentTransform.worldTransform;
    const wt = this.worldTransform;

    wt.a = lt.a * pt.a + lt.b * pt.c;
    wt.b = lt.a * pt.b + lt.b * pt.d;
    wt.c = lt.c * pt.a + lt.d * pt.c;
    wt.d = lt.c * pt.b + lt.d * pt.d;
    wt.tx = lt.tx * pt.a + lt.ty * pt.c + pt.tx;
    wt.ty = lt.tx * pt.b + lt.ty * pt.d + pt.ty;
  }

  setFromMatrix(matrix: Matrix): void {
    matrix.decompose(this);
  }

  protected updateSkew(): void {
    this._cx = Math.cos(this._rotation + this.skew.y);
    this._sx = Math.sin(this._rotation + this.skew.y);
    this._cy = -Math.sin(this._rotation - this.skew.x); // cos, added PI/2
    this._sy = Math.cos(this._rotation - this.skew.x); // sin, added PI/2
  }

  get rotation(): number {
    return this._rotation;
  }

  set rotation(value: number) {
    if (this._rotation !== value) {
      this._rotation = value;
      this.updateSkew();
    }
  }
}
