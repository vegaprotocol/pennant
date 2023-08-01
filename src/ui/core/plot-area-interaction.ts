import { ScaleLinear, ScaleTime } from "@util/types";
import { mean } from "d3-array";
import { Dispatch, dispatch } from "d3-dispatch";
import { pointers, Selection } from "d3-selection";
import {
  zoom as d3Zoom,
  ZoomBehavior,
  zoomIdentity,
  ZoomTransform,
} from "d3-zoom";

export class PlotAreaInteraction {
  private listeners: Dispatch<object> = dispatch(
    "contextmenu",
    "dblclick",
    "mousemove",
    "mouseout",
    "zoom",
    "zoomend",
    "zoomstart",
  );

  private _xScale: ScaleTime;
  private _yScale: ScaleLinear;
  private z: ZoomTransform = zoomIdentity;

  private zoom: ZoomBehavior<Element, unknown>;

  private tempTransform: ZoomTransform = zoomIdentity;

  constructor(x: ScaleTime, y: ScaleLinear) {
    this._xScale = x.copy();
    this._yScale = y.copy();

    this.zoom = d3Zoom()
      .filter((e: { type: string }) => {
        if (e.type === "dblclick") {
          this.listeners.call("dblclick", this, e);
          return false;
        }

        return true;
      })
      .on("zoom", (e) => {
        const t = e.transform;
        const k = t.k / this.z.k;
        const point = this.center(e); // TODO: Check if this is still valid

        this.listeners.call(
          "zoom",
          this,
          e,
          {
            x: t.x - this.z.x,
            y: t.y - this.z.y,
            k: k,
          },
          point,
        );

        this.z = t;
      })
      .on("start", (e) => {
        this.tempTransform = e.transform;
        this.listeners.call("zoomstart", this);
      })
      .on("end", (e) => {
        // If we haven't panned or scaled then do not fire a "zoomend" event"
        if (
          e.transform.k === this.tempTransform.k &&
          e.transform.x === this.tempTransform.x &&
          e.transform.y === this.tempTransform.y
        ) {
          return;
        }

        this.listeners.call("zoomend", this, [
          e.sourceEvent.offsetX,
          e.sourceEvent.offsetY,
        ]);
      });
  }

  private center(event: any) {
    if (event.sourceEvent) {
      const p = pointers(event);
      return [mean(p, (d) => d[0]), mean(p, (d) => d[1])];
    }

    return [
      (this._xScale.range()[1] - this._xScale.range()[0]) / 2,
      (this._yScale.range()[0] - this._yScale.range()[1]) / 2,
    ];
  }

  draw(selection: Selection<Element, any, any, any>): void {
    selection.call(this.zoom);

    selection
      .on("mousemove", (event) =>
        this.listeners.call("mousemove", this, [event.offsetX, event.offsetY]),
      )
      .on("mouseout", () => this.listeners.call("mouseout", this))
      .on("contextmenu", (event) => {
        event.preventDefault();
        this.listeners.call("contextmenu", this, {
          position: [event.pageX, event.pageY],
          price: this._yScale.invert(event.offsetY),
        });
      });
  }

  on(typenames: string, callback: (this: object, ...args: any[]) => void) {
    this.listeners.on(typenames, callback);
    return this;
  }

  xScale = (x: ScaleTime): this => {
    this._xScale = x.copy();
    return this;
  };

  yScale = (y: ScaleLinear): this => {
    this._yScale = y.copy();
    return this;
  };
}
