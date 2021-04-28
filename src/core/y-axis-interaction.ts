import { Selection } from "d3-selection";
import { drag as d3Drag, DragBehavior } from "d3-drag";
import { Dispatch, dispatch } from "d3-dispatch";

/**
 * The y-axis interaction component handles dragging interactions.
 */
export class YAxisInteraction {
  private drag: DragBehavior<Element, unknown, unknown> = d3Drag<
    Element,
    unknown
  >().on("drag", (e) => {
    this.listeners.call("drag", this, e);
  });
  private listeners: Dispatch<object> = dispatch("drag");

  draw(selection: Selection<Element, any, any, any>) {
    selection.call(this.drag);
  }

  on(
    typenames: string,
    callback: (this: object, ...args: any[]) => void
  ): this {
    this.listeners.on(typenames, callback);
    return this;
  }
}
