import { RenderableHTMLElement } from "@ui/elements";
import { ScaleLinear, ScaleTime } from "@util/types";
import { Dispatch, dispatch } from "d3-dispatch";
import { Selection } from "d3-selection";

export class PlotAreaAnnotations {
  private listeners: Dispatch<object> = dispatch("click");

  private _xScale: ScaleTime;
  private _yScale: ScaleLinear;
  private _labels: RenderableHTMLElement[];

  constructor(x: ScaleTime, y: ScaleLinear, labels: RenderableHTMLElement[]) {
    this._xScale = x.copy();
    this._yScale = y.copy();
    this._labels = labels;
  }

  draw(selection: Selection<Element, any, any, any>): void {
    for (const label of this._labels) {
      label.draw(selection, this._xScale, this._yScale);
    }
  }

  labels = (labels: RenderableHTMLElement[]): this => {
    this._labels = labels;
    return this;
  };

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
