import { Renderer } from "../core";
import { Sprite } from "./sprite";

export class SpriteRenderer {
  protected renderer: Renderer;

  constructor(renderer: Renderer) {
    this.renderer = renderer;
  }

  render(sprite: Sprite): void {
    const texture = sprite._texture;
    const renderer = this.renderer;
    const context = renderer.context;

    const width = texture._frame.width;
    const height = texture._frame.height;

    let wt = sprite.transform.worldTransform;
    let dx = 0;
    let dy = 0;

    const source = texture.baseTexture.getDrawableSource();

    dx = (0.5 - sprite.anchor.x) * texture.orig.width;
    dy = (0.5 - sprite.anchor.y) * texture.orig.height;

    dx -= width / 2;
    ``;
    dy -= height / 2;

    renderer.setContextTransform(wt, sprite.roundPixels, 1);

    if (sprite.roundPixels) {
      dx = dx | 0;
      dy = dy | 0;
    }

    const resolution = texture.baseTexture.resolution;

    context.drawImage(
      source,
      texture._frame.x * resolution,
      texture._frame.y * resolution,
      Math.floor(width * resolution),
      Math.floor(height * resolution),
      Math.floor(dx * renderer.resolution),
      Math.floor(dy * renderer.resolution),
      Math.floor(width * renderer.resolution),
      Math.floor(height * renderer.resolution),
    );
  }
}
