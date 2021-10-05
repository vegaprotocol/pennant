import { CurveFactory, curveStepBefore } from "d3-shape";

import { Texture } from "../../../renderer";
import { Container } from "../../../renderer/display";
import { Graphics } from "../../../renderer/graphics";
import { Rectangle } from "../../../renderer/math";

const canvas = document.createElement("canvas");
document.body.appendChild(canvas);

function createGradTexture() {
  // adjust it if somehow you need better quality for very very big images
  const quality = 100;
  //const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = quality;

  const ctx = canvas.getContext("2d");

  // use canvas2d API to create gradient
  const grd = ctx!.createLinearGradient(0, 0, 0, quality);
  grd.addColorStop(0, "#044e80");
  grd.addColorStop(1, "#000000");

  ctx!.fillStyle = grd;
  ctx!.fillRect(0, 0, 1, quality);

  return Texture.from(canvas);
}

const gradTexture = createGradTexture();

gradTexture.orig = new Rectangle(0, 0, 1, 100);
gradTexture._frame = new Rectangle(0, 0, 1, 100);

/**
 * Draws two area curves
 */
export class LineCurve extends Container {
  private area: Graphics = new Graphics();
  private line: Graphics = new Graphics();

  private stroke: number;
  private fill: number;
  private curve: CurveFactory;

  constructor(
    stroke: number = 0,
    fill: number = 0xffffff,
    curve: CurveFactory = curveStepBefore
  ) {
    super();

    this.stroke = stroke;
    this.fill = fill;
    this.curve = curve;

    this.area.lineStyle({ width: 0 });
    this.line.lineStyle({ width: 1, color: stroke, alpha: 0.5 });

    this.addChild(this.area);
    this.addChild(this.line);
  }

  public update(
    points: [number, number][],
    height: number,
    resolution: number = 1
  ): void {
    this.area.clear();
    this.area.beginTextureFill({ texture: gradTexture });
    this.area.drawArea(points, this.curve, height);
    this.area.endFill();

    this.line.clear();
    this.line.lineStyle({ width: 1, color: 0x009cff });
    this.line.drawLine(points, this.curve);
  }
}
