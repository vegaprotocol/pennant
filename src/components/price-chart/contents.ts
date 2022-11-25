import { curveStepAfter } from "d3-shape";

import { Renderer } from "../../renderer";
import { Container } from "../../renderer/display";
import { Colors } from "../depth-chart/helpers";

type ContentsColors = Pick<
  Colors,
  "buyFill" | "buyStroke" | "sellFill" | "sellStroke"
>;

/**
 * Responsible for drawing area curves for depth chart.
 */
export class Contents {
  public stage: Container = new Container();
  public renderer: Renderer;

  public colors: ContentsColors;

  constructor(options: {
    view: HTMLCanvasElement;
    resolution: number;
    width: number;
    height: number;
    colors: ContentsColors;
  }) {
    this.renderer = new Renderer({
      view: options.view,
      resolution: options.resolution,
      width: options.width,
      height: options.height,
    });

    this.colors = options.colors;
  }

  public render(): void {
    this.renderer.render(this.stage);
  }

  public update(data: { date: Date; price: number }[]): void {
    const resolution = this.renderer.resolution;
    /* 
        this.buyCurve.update(
          buyPoints,
          this.renderer.view.height,
          resolution,
          this.colors.buyFill,
          this.colors.buyStroke
        );
    
        this.sellCurve.update(
          sellPoints,
          this.renderer.view.height,
          resolution,
          this.colors.sellFill,
          this.colors.sellStroke
        ); */
  }
}
