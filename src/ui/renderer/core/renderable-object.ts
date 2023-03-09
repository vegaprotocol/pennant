import { Rectangle } from "../math";
import { Renderer } from "./renderer";

/**
 * Interface for DisplayObject to interface with Renderer.
 * The minimum APIs needed to implement a renderable object.
 */
export interface RenderableObject {
  parent: RenderableContainer | null;
  enableTempParent(): RenderableContainer | null;
  updateTransform(): void;
  disableTempParent(parent: RenderableContainer): void;
  render(renderer: Renderer): void;
}

/**
 * Interface for Container to interface with Renderer.
 */
export interface RenderableContainer extends RenderableObject {
  /** Get Local bounds for container */
  getLocalBounds(rect?: Rectangle, skipChildrenUpdate?: boolean): Rectangle;
}
