import { settings } from "../../settings";
import { CanvasResource } from "./resources/canvas-resource";
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

    // Convert the resource to a Resource object
    if (resource && !(resource instanceof Resource)) {
      resource = new CanvasResource(resource); // FIXME: Should auto detect rather than hard code Canvas only
    }

    this.setResource(resource);
  }

  getDrawableSource(): CanvasImageSource {
    const resource = this.resource as any;

    return resource ? resource.bitmap || resource.source : null;
  }

  setRealSize(
    realWidth: number,
    realHeight: number,
    resolution?: number
  ): this {
    this.resolution = resolution || this.resolution;
    this.width = realWidth / this.resolution;
    this.height = realHeight / this.resolution;

    return this;
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
