import { settings } from "../settings";
import { hex2rgb, hex2string } from "../utils";

export interface RendererOptions {
  backgroundColor: number;
  backgroundAlpha: number;
  resolution: number;
  view: HTMLCanvasElement;
}

export abstract class AbstractRenderer {
  public resolution: number;
  public readonly view: HTMLCanvasElement;

  protected _backgroundColor: number = 0x000000;
  protected _backgroundColorString: string = "#000000";
  _backgroundColorRgba: number[] = [0, 0, 0, 1];

  constructor(options?: Partial<RendererOptions>) {
    this.resolution = options?.resolution || settings.RESOLUTION;
    this.view = options?.view || document.createElement("canvas");

    this.backgroundColor = options?.backgroundColor || this._backgroundColor;
    this.backgroundAlpha = options?.backgroundAlpha || 1;
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
