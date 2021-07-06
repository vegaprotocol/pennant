import { DisplayObject } from "../display/display-object";
import { AbstractRenderer, RendererOptions } from "./abstract-renderer";

export class Renderer extends AbstractRenderer {
  public context: CanvasRenderingContext2D;

  constructor(options?: RendererOptions) {
    super(options);

    this.context = this.view.getContext("2d") as CanvasRenderingContext2D;
  }

  public render(displayObject: DisplayObject) {
    const context = this.context;

    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.globalAlpha = 1;

    displayObject.render(this);

    context.restore();
  }

  public clear(
    clearColor: string = this._backgroundColorString,
    alpha: number = this.backgroundAlpha
  ): void {
    const context = this.context;

    context.clearRect(0, 0, this.width, this.height);

    if (clearColor) {
      context.globalAlpha = alpha;
      context.fillStyle = clearColor;
      context.fillRect(0, 0, this.width, this.height);
      context.globalAlpha = 1;
    }
  }
}
