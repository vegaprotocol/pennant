import { Dispatch, dispatch } from "d3-dispatch";
import { drag as d3Drag, DragBehavior } from "d3-drag";
import { Selection } from "d3-selection";

/**
 * The x-axis interaction component handles dragging interactions.
 */
export class XAxisInteraction {
  private drag: DragBehavior<Element, unknown, unknown> = d3Drag<
    Element,
    unknown
  >().on("drag", (e) => {
    this.listeners.call("drag", this, e);
  });
  private listeners: Dispatch<object> = dispatch("dblclick", "drag");

  draw(selection: Selection<Element, any, any, any>) {
    selection.call(this.drag).on("dblclick", () => {
      this.listeners.call("dblclick");
    });
  }

  on(
    typenames: string,
    callback: (this: object, ...args: any[]) => void,
  ): this {
    this.listeners.on(typenames, callback);
    return this;
  }
}
