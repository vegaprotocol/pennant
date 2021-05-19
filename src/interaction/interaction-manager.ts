import { DisplayObject, Point } from "../display";
import { CanvasRenderer, Renderer } from "../canvas";
import { TreeSearch } from ".";

export interface InteractionEvent {
  target: DisplayObject | null;
  data: { global: Point | null };
}

const hitTestEvent: InteractionEvent = {
  target: null,
  data: {
    global: null,
  },
};

export class InteractionManager {
  public renderer: Renderer;
  public search: TreeSearch = new TreeSearch();

  constructor(renderer: Renderer) {
    /**
     * The renderer this interaction manager works for.
     */
    this.renderer = renderer;
  }

  /**
   * Hit tests a point against the display tree, returning the first interactive object that is hit.
   *
   * @param globalPoint - A point to hit test with, in global space.
   * @param root - The root display object to start from.
   * @return The hit display object, if any.
   */
  public hitTest(
    globalPoint: Point,
    root: DisplayObject
  ): DisplayObject | null {
    hitTestEvent.target = null;
    hitTestEvent.data.global = globalPoint;

    this.search.findHit(hitTestEvent, root);

    return hitTestEvent.target;
  }
}
