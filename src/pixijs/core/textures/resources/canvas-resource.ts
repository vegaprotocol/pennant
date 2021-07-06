import { BaseImageResource } from "./base-image-resource";

export class CanvasResource extends BaseImageResource {
  constructor(source: HTMLCanvasElement) {
    super(source);
  }
}
