import { bisector, extent } from "d3-array";
import { closestIndexTo } from "date-fns";
import { clamp } from "lodash";

import { Application } from "../app/application";
import { Container } from "../display";
import { Point } from "../display/display-object";
import { Graphics } from "../graphics/graphics";
import { CrosshairElement, GridElement } from "../elements";
import { clearCanvas, Colors } from "../helpers";
import { InteractionManager } from "../interaction/interaction-manager";
import { RenderableElement, ScaleLinear, ScaleTime } from "../types";
import { GraphicsGeometry } from "../graphics";
import { Rectangle } from "../math";

export class PlotArea {
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

  private app: Application;
  private interactionManager: InteractionManager;

  constructor(
    canvas: HTMLCanvasElement,
    x: ScaleTime,
    y: ScaleLinear,
    elements: RenderableElement[],
    originalData: any[],
    fields: string[],
    labels: RenderableElement[]
  ) {
    this._xScale = x.copy();
    this._yScale = y.copy();
    this._renderableElements = elements;
    this._data = originalData;
    this._yEncodingFields = fields;
    this._labels = labels;

    this.app = new Application({
      resolution: 1.5,
      view: canvas,
    });

    const container = new Container();

    const rectangle = new Rectangle(100, 100, 100, 100);
    const graphicsGeometry = new GraphicsGeometry().drawShape(
      rectangle,
      {
        color: "red",
        visible: true,
      },
      { alignment: 0.5, color: "white", visible: true, width: 1 }
    );

    const graphics = new Graphics(graphicsGeometry);
    graphics.interactive = true;

    container.addChild(graphics);

    this.app.stage.addChild(container);

    this.interactionManager = new InteractionManager(this.app.renderer);
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

      for (const element of this._renderableElements) {
        element.draw(this.ctx, this._xScale, this._yScale, this._pixelRatio);
      }

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

      for (const label of this._labels) {
        label.draw(this.ctx, this._xScale, this._yScale, this._pixelRatio);
      }

      this.app.render();
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
    const secondElement: Date =
      this._data[Math.min(this._data.length - 1, index)].date;

    let indexOffset = 0;

    if (firstElement && secondElement) {
      const nearestCandleDates = [firstElement, secondElement];
      indexOffset = closestIndexTo(timeAtMouseX, nearestCandleDates);
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

  hitTest(offset: [number, number]) {
    console.log(offset);
    console.log(
      this.interactionManager.hitTest(
        new Point(offset[0], offset[1]),
        this.app.stage
      )
    );
  }
}
