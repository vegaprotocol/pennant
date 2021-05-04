import { Colors, clearCanvas } from "../helpers";
import { CrosshairElement, GridElement } from "../elements";
import { RenderableElement, ScaleLinear, ScaleTime } from "../types";
import { bisector, extent } from "d3-array";

import { clamp } from "lodash";
import { closestIndexTo } from "date-fns";

export class PlotArea {
  private _crosshair: CrosshairElement = new CrosshairElement();
  private ctx: CanvasRenderingContext2D | null = null;
  private _data: any[];
  private gridline: GridElement = new GridElement();
  private latestPriceCrosshair: CrosshairElement = new CrosshairElement();
  private latestPricePosition: number | null = null;
  private _pixelRatio: number = 1;
  private position: [Date | null, number | null] = [null, null];
  private _renderableElements: RenderableElement[];
  private _xScale: ScaleTime;
  private _yEncodingFields: string[];
  private _yScale: ScaleLinear;

  constructor(
    x: ScaleTime,
    y: ScaleLinear,
    elements: RenderableElement[],
    originalData: any[],
    fields: string[]
  ) {
    this._xScale = x.copy();
    this._yScale = y.copy();
    this._renderableElements = elements;
    this._data = originalData;
    this._yEncodingFields = fields;
  }

  context(context: CanvasRenderingContext2D) {
    this.ctx = context;
    return this;
  }

  crosshair(pos: [Date | null, number | null]) {
    this.position = pos;
    return this;
  }

  data(originalData: any[]) {
    this._data = originalData;
    return this;
  }

  draw() {
    if (this.ctx) {
      clearCanvas(this.ctx.canvas, this.ctx, Colors.BACKGROUND);

      this.gridline.draw(
        this.ctx,
        this._xScale,
        this._yScale,
        this._pixelRatio
      );

      this._renderableElements[0].draw(
        this.ctx,
        this._xScale,
        this._yScale,
        this._pixelRatio
      );

      this._renderableElements.forEach((element) => {
        if (this.ctx) {
          element.draw(this.ctx, this._xScale, this._yScale, this._pixelRatio);
        }
      });

      this.latestPriceCrosshair.draw(
        this.ctx,
        this._xScale,
        this._yScale,
        this._pixelRatio,
        [null, this.latestPricePosition]
      );

      this._crosshair.draw(
        this.ctx,
        this._xScale,
        this._yScale,
        this._pixelRatio,
        this.position
      );
    }
  }

  extent(bounds?: [Date, Date]) {
    const domain = bounds
      ? extent(
          this._data
            .filter((d) => d.date >= bounds[0] && d.date <= bounds[1])
            .flatMap((d) => this._yEncodingFields?.map((field) => d[field]))
        )
      : extent(
          this._data.flatMap((d) =>
            this._yEncodingFields?.map((field) => d[field])
          )
        );

    const domainWidth = Math.abs(domain[1] - domain[0]);

    return [domain[0] - domainWidth * 0.1, domain[1] + domainWidth * 0.2];
  }

  getIndex(offset: number): [number, Date] {
    const timeAtMouseX = this._xScale.invert(offset);
    const index = bisector((d: any) => d.date).left(this._data, timeAtMouseX);
    const firstElement: Date = this._data[Math.max(0, index - 1)].date;
    const secondElement: Date = this._data[
      Math.min(this._data.length - 1, index)
    ].date;

    let element: Date;
    let indexOffset = 0;

    if (firstElement && secondElement) {
      const nearestCandleDates = [firstElement, secondElement];
      indexOffset = closestIndexTo(timeAtMouseX, nearestCandleDates);
      element = [firstElement, secondElement][indexOffset];
    } else if (firstElement) {
      indexOffset = 0;
      element = firstElement;
    } else {
      indexOffset = 1;
      element = secondElement;
    }

    const dataIndex = clamp(index + indexOffset - 1, 0, this._data.length - 1);

    return [dataIndex, this._data[dataIndex].date];
  }

  pixelRatio(ratio: number) {
    this._pixelRatio = ratio;
    return this;
  }

  latestPrice(price: number | null): this {
    this.latestPricePosition = price;
    return this;
  }

  renderableElements(elements: RenderableElement[]) {
    this._renderableElements = elements;
    return this;
  }

  xScale(x: ScaleTime) {
    this._xScale = x.copy();
    return this;
  }

  yEncodingFields(fields: string[]) {
    this._yEncodingFields = fields;
    return this;
  }

  yScale(y: ScaleLinear) {
    this._yScale = y.copy();
    return this;
  }
}
