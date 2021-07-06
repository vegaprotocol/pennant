import { settings } from "../../settings";
import { Resource } from "./resources/resource";

export type ImageSource =
  | HTMLImageElement
  | HTMLCanvasElement
  | HTMLVideoElement
  | ImageBitmap;

export interface BaseTextureOptions {
  height: number;
  resolution: number;
  width: number;
}

export class BaseTexture<R extends Resource = Resource> {
  public width: number;
  public height: number;
  public resolution: number;
  public resource: R | null = null;

  constructor(
    resource: R | ImageSource | string | any = null,
    options: Partial<BaseTextureOptions>
  ) {
    this.height = options.height ?? 0;
    this.resolution = options.resolution ?? settings.RESOLUTION;
    this.width = options.height ?? 0;

    this.setResource(resource);
  }

  getDrawableSource(): CanvasImageSource {
    const resource = this.resource as any;

    return resource ? resource.bitmap || resource.source : null;
  }

  setResource(resource: R): this {
    if (this.resource === resource) {
      return this;
    }

    if (this.resource) {
      throw new Error("Resource can be set only once");
    }

    this.resource = resource;

    return this;
  }
}
