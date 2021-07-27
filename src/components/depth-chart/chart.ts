import { Renderer } from "../../pixijs";
import { Container } from "../../pixijs/display";
import { Rectangle } from "../../pixijs/math";
import { FILL_BUY_LIGHT, FILL_SELL_LIGHT, GRAY, HEIGHT, STROKE_BUY_LIGHT, STROKE_SELL_LIGHT, WIDTH } from "./depth-chart";
import { DepthCurve, VerticalLine } from "./display-objects";

export class Chart {
  public stage: Container = new Container();
  public renderer: Renderer;

  public buyCurve: DepthCurve = new DepthCurve(
    STROKE_BUY_LIGHT,
    FILL_BUY_LIGHT
  );
  public sellCurve: DepthCurve = new DepthCurve(
    STROKE_SELL_LIGHT,
    FILL_SELL_LIGHT
  );

  public midPriceLine: VerticalLine = new VerticalLine(1, GRAY);

  constructor(view: HTMLCanvasElement) {
    this.renderer = new Renderer({
      view: view,
      resolution: 1.5,
      width: WIDTH,
      height: HEIGHT,
    });

    this.stage.addChild(this.midPriceLine);
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
    this.midPriceLine.update(WIDTH / 2);
    this.buyCurve.update(buyPoints);
    this.sellCurve.update(sellPoints);
  }

  get screen(): Rectangle {
    return this.renderer.screen;
  }
}
