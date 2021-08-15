import { curveStepAfter } from "d3-shape";

import { Renderer } from "../../renderer";
import { Container } from "../../renderer/display";
import { Rectangle } from "../../renderer/math";
import { BUY_FILL, BUY_STROKE, SELL_FILL, SELL_STROKE } from "./depth-chart";
import { DepthCurve } from "./display-objects";

/**
 * Responsible for drawing area curves for depth chart.
 */
export class Chart {
  public stage: Container = new Container();
  public renderer: Renderer;

  public buyCurve: DepthCurve = new DepthCurve(
    BUY_STROKE,
    BUY_FILL,
    curveStepAfter
  );

  public sellCurve: DepthCurve = new DepthCurve(
    SELL_STROKE,
    SELL_FILL,
    curveStepAfter
  );

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

    this.stage.addChild(this.buyCurve);
    this.stage.addChild(this.sellCurve);
  }

  public render(): void {
    this.renderer.render(this.stage);
  }

  public update(
    buyPoints: [number, number][],
    sellPoints: [number, number][]
  ): void {
    const resolution = this.renderer.resolution;

    this.buyCurve.update(buyPoints, this.renderer.view.height, resolution);
    this.sellCurve.update(sellPoints, this.renderer.view.height, resolution);
  }
}
