import { Rectangle } from "../math";
import { Renderer } from "./renderer";

export interface RenderableObject {
  parent: RenderableContainer | null;
  enableTempParent(): RenderableContainer | null;
  updateTransform(): void;
  disableTempParent(parent: RenderableContainer): void;
  render(renderer: Renderer): void;
}

export interface RenderableContainer extends RenderableObject {
  /** Get Local bounds for container */
  getLocalBounds(rect?: Rectangle, skipChildrenUpdate?: boolean): Rectangle;
}
