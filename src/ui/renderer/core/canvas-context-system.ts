import { Matrix } from "../math";
import { Renderer } from "./renderer";

const tempMatrix = new Matrix();

export class CanvasContextSystem {
  private renderer: Renderer;

  public rootContext: CanvasRenderingContext2D | null = null;
  public activeContext: CanvasRenderingContext2D | null = null;
  public activeResolution = 1;

  private _projTransform: Matrix | null = null;

  constructor(renderer: Renderer) {
    this.renderer = renderer;

    this.rootContext = this.renderer.view.getContext("2d");
    this.activeContext = this.rootContext;
  }

  setContextTransform(
    transform: Matrix,
    roundPixels?: boolean,
    localResolution?: number,
  ): void {
    let mat = transform;
    const proj = this._projTransform;
    const contextResolution = this.activeResolution;

    localResolution = localResolution || contextResolution;

    if (proj) {
      mat = tempMatrix;
      mat.copyFrom(transform);
      mat.prepend(proj);
    }

    if (roundPixels) {
      this.activeContext?.setTransform(
        mat.a * localResolution,
        mat.b * localResolution,
        mat.c * localResolution,
        mat.d * localResolution,
        (mat.tx * contextResolution) | 0,
        (mat.ty * contextResolution) | 0,
      );
    } else {
      this.activeContext?.setTransform(
        mat.a * localResolution,
        mat.b * localResolution,
        mat.c * localResolution,
        mat.d * localResolution,
        mat.tx * contextResolution,
        mat.ty * contextResolution,
      );
    }
  }
}
