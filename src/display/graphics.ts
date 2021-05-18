import { CanvasRenderer } from "../renderer";
import { Container } from ".";

export class Graphics extends Container {
  /**
   * Renders the object using the Canvas renderer
   *
   * @param renderer - The renderer
   */
  protected _render(renderer: CanvasRenderer): void {
    console.info("Hello");
  }
}
