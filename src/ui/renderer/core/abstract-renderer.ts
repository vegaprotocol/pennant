import { Rectangle } from "../math";
import { settings } from "../settings";
import { hex2rgb, hex2string } from "../utils";
import { RenderableObject } from "./renderable-object";

export interface RendererOptions {
  width?: number;
  height?: number;
  backgroundColor?: number;
  backgroundAlpha?: number;
  resolution?: number;
  view?: HTMLCanvasElement;
}

export interface RendererPlugins {
  [key: string]: any;
}

export abstract class AbstractRenderer {
  /** The resolution / device pixel ratio of the renderer. */
  public resolution: number;

  /** The canvas element that everything is drawn to. */
  public readonly view: HTMLCanvasElement;

  /**
   * Measurements of the screen. (0, 0, screenWidth, screenHeight).
   *
   * Its safe to use as filterArea or hitArea for the whole stage.
   */
  public readonly screen: Rectangle;

  /** Collection of plugins */
  public readonly plugins: RendererPlugins = {};

  protected _backgroundColor: number = 0x000000;
  protected _backgroundColorString: string = "#000000";
  _backgroundColorRgba: number[] = [0, 0, 0, 1];
  _lastObjectRendered: RenderableObject | null;

  constructor(options?: Partial<RendererOptions>) {
    this.resolution = options?.resolution || settings.RESOLUTION;

    this.screen = new Rectangle(
      0,
      0,
      options?.width ?? 800,
      options?.height ?? 600,
    );
    this.view = options?.view || document.createElement("canvas");

    this.backgroundColor = options?.backgroundColor || this._backgroundColor;
    this.backgroundAlpha = options?.backgroundAlpha || 1;

    this._lastObjectRendered = null;
  }

  public resize(screenWidth: number, screenHeight: number): void {
    this.screen.width = screenWidth;
    this.screen.height = screenHeight;

    this.view.width = screenWidth * this.resolution;
    this.view.height = screenHeight * this.resolution;

    this.view.style.width = `${screenWidth}px`;
    this.view.style.height = `${screenHeight}px`;
  }

  public destroy(): void {
    this.plugins.interaction.destroy();
    this.plugins.interaction = null;

    const thisAny = this as any;

    thisAny.plugins = null;
    thisAny.view = null;
    thisAny.screen = null;
    thisAny._tempDisplayObjectParent = null;
    thisAny.options = null;
    this._lastObjectRendered = null;
  }

  get width(): number {
    return this.view.width;
  }

  get height(): number {
    return this.view.height;
  }

  get backgroundColor(): number {
    return this._backgroundColor;
  }

  set backgroundColor(value: number) {
    this._backgroundColor = value;
    this._backgroundColorString = hex2string(value);
    hex2rgb(value, this._backgroundColorRgba);
  }

  get backgroundAlpha(): number {
    return this._backgroundColorRgba[3];
  }

  set backgroundAlpha(value: number) {
    this._backgroundColorRgba[3] = value;
  }
}
