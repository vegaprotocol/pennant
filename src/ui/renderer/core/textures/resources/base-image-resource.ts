import { ImageSource } from "../base-texture";
import { Resource } from "./resource";

export class BaseImageResource extends Resource {
  public source: ImageSource;

  constructor(source: ImageSource) {
    const sourceAny = source as any;

    const width =
      sourceAny.naturalWidth || sourceAny.videoWidth || sourceAny.width;

    const height =
      sourceAny.naturalHeight || sourceAny.videoHeight || sourceAny.height;

    super(width, height);

    this.source = source;
  }
}
