import { Renderer } from ".";
import { Graphics } from "../graphics";
import { Rectangle, Shapes } from "../math";

/**
 * Renderer dedicated to drawing and batching graphics objects.
 */
export class CanvasGraphicsRenderer {
  public renderer: Renderer;

  /**
   * @param renderer - The current renderer.
   */
  constructor(renderer: Renderer) {
    this.renderer = renderer;
  }

  /**
   * Renders a Graphics object to a canvas.
   *
   * @param graphics - the actual graphics object to render
   */
  public render(graphics: Graphics): void {
    const renderer = this.renderer;
    const context = renderer.context;

    const graphicsData = graphics.geometry.graphicsData;

    for (const data of graphicsData) {
      const shape = data.shape;
      const fillStyle = data.fillStyle;
      const lineStyle = data.lineStyle;
      const fillColor = data.fillStyle.color;
      const lineColor = data.lineStyle.color;

      context.lineWidth = lineStyle.width;

      if (data.type === Shapes.Rectangle) {
        const tempShape = shape as Rectangle;

        if (fillStyle.visible) {
          context.fillStyle = fillColor;
          context.fillRect(
            tempShape.x,
            tempShape.y,
            tempShape.width,
            tempShape.height
          );
        }

        if (lineStyle.visible) {
          const alignmentOffset =
            lineStyle.width * (0.5 - (1 - lineStyle.alignment));
          const width = tempShape.width + 2 * alignmentOffset;
          const height = tempShape.height + 2 * alignmentOffset;

          context.strokeStyle = lineColor;
          context.strokeRect(
            tempShape.x - alignmentOffset,
            tempShape.y - alignmentOffset,
            width,
            height
          );
        }
      }
    }
  }
}
