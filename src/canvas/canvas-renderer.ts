import { DisplayObject } from "../display";
import { CanvasGraphicsRenderer } from "./canvas-graphics";

export interface Renderer {
  view: HTMLCanvasElement;
  context: CanvasRenderingContext2D;

  graphics: CanvasGraphicsRenderer;

  render(displayObject: DisplayObject): void;
}

export interface RendererOptions {
  view: HTMLCanvasElement;
  resolution?: number;
}

export class CanvasRenderer implements Renderer {
  public resolution: number;
  public readonly view: HTMLCanvasElement;
  public context: CanvasRenderingContext2D;
  public graphics: CanvasGraphicsRenderer;

  constructor(options: RendererOptions) {
    this.view = options.view;
    this.context = this.view.getContext("2d") as CanvasRenderingContext2D;
    this.resolution = options.resolution || 1;
    this.graphics = new CanvasGraphicsRenderer(this);
  }

  render(displayObject: DisplayObject): void {
    this.context.save();
    displayObject.render(this);
    this.context.restore();
  }
}
