import { ScaleLinear } from "d3-scale";
import { curveStepAfter } from "d3-shape";
import { times } from "lodash";

import { Renderer } from "../../renderer";
import { Container } from "../../renderer/display";
import { XGrid } from "./display-objects/x-grid";
import { YGrid } from "./display-objects/y-grid";

/**
 * Responsible for drawing area curves for depth chart.
 */
export class Contents {
  public stage: Container = new Container();
  public renderer: Renderer;

  public xGrid: XGrid = new XGrid();
  public yGrid: YGrid = new YGrid();

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
    timeScale: ScaleLinear<number, number>,
    priceScale: ScaleLinear<number, number>,
    width: number,
    height: number
  ): void {
    const resolution = this.renderer.resolution;

    this.xGrid.update(timeScale, width, height, resolution);
    this.yGrid.update(priceScale, width, height, resolution);
  }
}
