import { CrosshairElement, GridElement } from "@ui/elements";
import { clearCanvas } from "@util/misc";
import { RenderableElement, ScaleLinear, ScaleTime } from "@util/types";
import { bisector, extent } from "d3-array";
import { closestIndexTo, isValid } from "date-fns";
import { clamp } from "lodash";

import { Colors } from "../../feature/candlestick-chart/helpers";

export class PlotArea {
  public colors: Colors;

  private _crosshair: CrosshairElement = new CrosshairElement();
  private ctx: CanvasRenderingContext2D | null = null;
  private _data: any[];
  private gridline: GridElement = new GridElement();
  private _labels: RenderableElement[];
  private latestPriceCrosshair: CrosshairElement = new CrosshairElement();
  private latestPricePosition: number | null = null;
  private _pixelRatio: number = 1;
  private position: [Date | null, number | null] = [null, null];
  private _renderableElements: RenderableElement[];
  private _xScale: ScaleTime;
  private _yEncodingFields: string[];
  private _yScale: ScaleLinear;
  private isSimple: boolean = false;

  constructor(
    x: ScaleTime,
    y: ScaleLinear,
    elements: RenderableElement[],
    originalData: any[],
    fields: string[],
    labels: RenderableElement[],
    isSimple: boolean,
    colors: Colors,
  ) {
    this._xScale = x.copy();
    this._yScale = y.copy();
    this._renderableElements = elements;
    this._data = originalData;
    this._yEncodingFields = fields;
    this._labels = labels;
    this.isSimple = isSimple;
    this.colors = colors;
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
      clearCanvas(this.ctx.canvas, this.ctx, this.colors.backgroundSurface);

      this.gridline.draw(
        this.ctx,
        this._xScale,
        this._yScale,
        this._pixelRatio,
        this.colors.emphasis100,
      );

      this._renderableElements[0].draw(
        this.ctx,
        this._xScale,
        this._yScale,
        this._pixelRatio,
      );

      for (const element of this._renderableElements) {
        element.draw(this.ctx, this._xScale, this._yScale, this._pixelRatio);
      }

      if (!this.isSimple) {
        this.latestPriceCrosshair.draw(
          this.ctx,
          this._xScale,
          this._yScale,
          this._pixelRatio,
          [null, this.latestPricePosition],
          this.colors.textPrimary,
        );
      }

      this._crosshair.draw(
        this.ctx,
        this._xScale,
        this._yScale,
        this._pixelRatio,
        this.position,
        this.colors.textPrimary,
      );

      for (const label of this._labels) {
        label.draw(
          this.ctx,
          this._xScale,
          this._yScale,
          this._pixelRatio,
          this.colors,
        );
      }
    }
  }

  extent(bounds?: [Date, Date]) {
    const domain = bounds
      ? extent(
          this._data
            .filter((d) => d.date >= bounds[0] && d.date <= bounds[1])
            .flatMap((d) => this._yEncodingFields?.map((field) => d[field])),
        )
      : extent(
          this._data.flatMap(
            (d) => this._yEncodingFields?.map((field) => d[field]),
          ),
        );

    const domainWidth = Math.abs(domain[1] - domain[0]);

    return [domain[0] - domainWidth * 0.1, domain[1] + domainWidth * 0.2];
  }

  getIndex(offset: number): [number, Date] | null {
    const timeAtMouseX = this._xScale.invert(offset);

    if (!isValid(timeAtMouseX)) {
      return null;
    }

    const index = bisector((d: any) => d.date).left(this._data, timeAtMouseX);

    if (this._data.length === 0) {
      return null;
    }

    const firstElement: Date = this._data[Math.max(0, index - 1)].date;
    const secondElement: Date =
      this._data[Math.min(this._data.length - 1, index)].date;

    let indexOffset = 0;

    if (firstElement && secondElement) {
      const nearestCandleDates = [firstElement, secondElement];
      indexOffset = closestIndexTo(timeAtMouseX, nearestCandleDates) ?? 0;
    } else if (firstElement) {
      indexOffset = 0;
    } else {
      indexOffset = 1;
    }

    const dataIndex = clamp(index + indexOffset - 1, 0, this._data.length - 1);

    return [dataIndex, this._data[dataIndex].date];
  }

  pixelRatio(ratio: number) {
    this._pixelRatio = ratio;
    return this;
  }

  labels(elements: RenderableElement[]) {
    this._labels = elements;
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
