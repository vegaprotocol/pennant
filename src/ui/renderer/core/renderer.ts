import { GraphicsRenderer } from "../graphics";
import { InteractionManager } from "../interaction/interaction-manager";
import { Matrix } from "../math";
import { SpriteRenderer } from "../sprite/sprite-renderer";
import { AbstractRenderer, RendererOptions } from "./abstract-renderer";
import { CanvasContextSystem } from "./canvas-context-system";
import { CanvasMaskSystem } from "./canvas-mask-system";
import { GeometrySystem } from "./geometry/geometry-system";
import { RenderableObject } from "./renderable-object";

const tempMatrix = new Matrix();

export class Renderer extends AbstractRenderer {
  public mask: CanvasMaskSystem | null = null;
  public canvasContext: CanvasContextSystem | null = null;
  public context: CanvasRenderingContext2D;
  public geometry: GeometrySystem | null;

  private _projTransform: Matrix | null;

  constructor(options?: RendererOptions) {
    super(options);

    this.context = this.view.getContext("2d") as CanvasRenderingContext2D;
    this.context.imageSmoothingEnabled = true;
    this.geometry = null;

    this.plugins.sprite = new SpriteRenderer(this);
    this.plugins.graphics = new GraphicsRenderer(this);
    this.plugins.interaction = new InteractionManager(this);

    this._projTransform = null;

    this.mask = new CanvasMaskSystem(this);
    this.canvasContext = new CanvasContextSystem(this);

    this.resize(options?.width ?? 800, options?.height ?? 600);
  }

  public render(displayObject: RenderableObject) {
    const context = this.context;

    this._lastObjectRendered = displayObject;

    displayObject.updateTransform();

    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.globalAlpha = 1;

    context.clearRect(0, 0, this.width, this.height);

    /*   context.fillStyle = this._backgroundColorString;
    context.fillRect(0, 0, this.width, this.height);
  */
    displayObject.render(this);

    context.restore();
  }

  public clear(
    clearColor: string = this._backgroundColorString,
    alpha: number = this.backgroundAlpha,
  ): void {
    const context = this.context;

    context.clearRect(0, 0, this.width, this.height);

    /*     if (clearColor) {
      context.globalAlpha = alpha;
      context.fillStyle = clearColor;
      context.fillRect(0, 0, this.width, this.height);
      context.globalAlpha = 1;
    } */
  }

  setContextTransform(
    transform: Matrix,
    roundPixels?: boolean,
    localResolution?: number,
  ): void {
    let mat = transform;
    const proj = this._projTransform;
    const resolution = 1;

    localResolution = localResolution || resolution;

    if (proj) {
      mat = tempMatrix;
      mat.copyFrom(transform);
      mat.prepend(proj);
    }

    if (roundPixels) {
      this.context.setTransform(
        mat.a * localResolution,
        mat.b * localResolution,
        mat.c * localResolution,
        mat.d * localResolution,
        (mat.tx * resolution) | 0,
        (mat.ty * resolution) | 0,
      );
    } else {
      this.context.setTransform(
        mat.a * localResolution,
        mat.b * localResolution,
        mat.c * localResolution,
        mat.d * localResolution,
        mat.tx * resolution,
        mat.ty * resolution,
      );
    }
  }
}
