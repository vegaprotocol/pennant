import { DisplayObject } from "../display";

export interface RendererOptions {
  view?: HTMLCanvasElement;
  resolution?: number;
}

export class CanvasRenderer {
  public resolution: number;
  public readonly view: HTMLCanvasElement;
  public context: CanvasRenderingContext2D;

  constructor(options: RendererOptions) {
    this.view = options.view || document.createElement("canvas");
    this.context = this.view.getContext("2d") as CanvasRenderingContext2D;
    this.resolution = options.resolution || 1;
  }

  render(displayObject: DisplayObject): void {
    this.context.save();
    displayObject.render(this);
    this.context.restore();
  }
}
