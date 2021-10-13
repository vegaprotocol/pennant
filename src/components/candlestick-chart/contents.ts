import { ScaleLinear, ScaleTime } from "d3-scale";
import { curveStepAfter } from "d3-shape";
import { times } from "lodash";

import { Renderer } from "../../renderer";
import { RenderableObject } from "../../renderer/core/renderable-object";
import { UpdatableObject } from "../../renderer/core/updatable-object";
import { Container, DisplayObject } from "../../renderer/display";
import { LineCurve } from "./display-objects";
import { XGrid } from "./display-objects/x-grid";
import { YGrid } from "./display-objects/y-grid";
import { Disposable } from "./disposable";

/**
 * Responsible for drawing candlestick chart contents.
 */
export class Contents implements Disposable {
  public stage: Container = new Container();
  public renderer: Renderer;

  public xGrid: XGrid = new XGrid();
  public yGrid: YGrid = new YGrid();
  public content: (UpdatableObject & DisplayObject)[] = [];

  constructor(options: {
    view: HTMLCanvasElement;
    resolution: number;
    width: number;
    height: number;
  }) {
    this.renderer = new Renderer({
      view: options.view,
      resolution: options.resolution,
      width: options.width,
      height: options.height,
    });

    this.stage.addChild(this.xGrid);
    this.stage.addChild(this.yGrid);
  }

  public render(): void {
    this.renderer.render(this.stage);
  }

  public update(
    timeScale: ScaleTime<number, number>,
    priceScale: ScaleLinear<number, number>,
    width: number,
    height: number
  ): void {
    const resolution = this.renderer.resolution;

    this.xGrid.update(timeScale, width, height, resolution);
    this.yGrid.update(priceScale, width, height, resolution);

    for (const element of this.content) {
      //(element as any).points = data.map((d) => [d.date, d.close]);
      if (element.update) {
        element.update(timeScale, priceScale, width, height, resolution);
      }
    }
  }

  public dispose() {}
}
