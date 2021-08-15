import { curveStepAfter } from "d3-shape";

import { Renderer } from "../../renderer";
import { Container } from "../../renderer/display";
import { Rectangle } from "../../renderer/math";
import {
  FILL_BUY_LIGHT,
  FILL_SELL_LIGHT,
  GRAY,
  STROKE_BUY_LIGHT,
  STROKE_SELL_LIGHT,
} from "./depth-chart";
import { DepthCurve, VerticalLine } from "./display-objects";

export class Chart {
  public stage: Container = new Container();
  public renderer: Renderer;

  public buyCurve: DepthCurve = new DepthCurve(
    STROKE_BUY_LIGHT,
    FILL_BUY_LIGHT,
    curveStepAfter
  );

  public sellCurve: DepthCurve = new DepthCurve(
    STROKE_SELL_LIGHT,
    FILL_SELL_LIGHT,
    curveStepAfter
  );

  constructor(options: any) {
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

  get screen(): Rectangle {
    return this.renderer.screen;
  }
}
