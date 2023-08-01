import {
  Container,
  Graphics,
  hex2string,
  Rectangle,
  Texture,
} from "@ui/renderer";
import { CurveFactory, curveLinear } from "d3-shape";
import { memoize, values } from "lodash";

function createGradTexture(
  colorStop1: number,
  colorStop2: number,
  size = 600,
  offset = 0,
  invert = false,
) {
  if (!invert) {
    offset = 0;
  }

  const canvas = document.createElement("canvas");

  // adjust it if somehow you need better quality for very very big images
  canvas.width = 1;
  canvas.height = size + offset;

  const ctx = canvas.getContext("2d");

  // use canvas2d API to create gradient
  const grd = ctx!.createLinearGradient(0, offset, 0, size + offset);
  grd.addColorStop(0, hex2string(!invert ? colorStop1 : colorStop2));
  grd.addColorStop(1, hex2string(!invert ? colorStop2 : colorStop1));

  ctx!.fillStyle = grd;
  ctx!.fillRect(0, offset, 1, size + offset);

  return Texture.from(canvas);
}

const createTexture = memoize(
  (
    colorStop1: number,
    colorStop2: number,
    size: number,
    offset = 0,
    invert = false,
  ) => {
    const gradTexture = createGradTexture(
      colorStop1,
      colorStop2,
      size,
      offset,
      invert,
    );

    gradTexture.orig = new Rectangle(0, 0, 1, size + offset);
    gradTexture._frame = new Rectangle(0, 0, 1, size + offset);

    return gradTexture;
  },
  (...args) => values(args).join("_"),
);

/**
 * Draws a line curve
 */
export class LineCurve extends Container {
  private line: Graphics = new Graphics();

  private stroke: number;
  private backgroundSurface: number;
  private curve: CurveFactory;

  constructor(
    stroke: number = 0,
    fill: number = 0xffffff,
    backgroundSurface: number = 0xffffff,
    curve: CurveFactory = curveLinear,
  ) {
    super();

    this.stroke = stroke;
    this.backgroundSurface = backgroundSurface;
    this.curve = curve;

    this.line.lineStyle({ width: 4, color: stroke, alpha: 0.5 });

    this.addChild(this.line);
  }

  public update(
    points: [number, number][],
    height: number,
    resolution: number = 1,
    fill: number = 0xffffff,
    stroke: number = 0,
    backgroundSurface: number = 0,
    invert: boolean,
    startPrice: number,
  ): void {
    this.stroke = stroke;
    this.backgroundSurface = backgroundSurface;

    this.line.clear();
    this.line.lineStyle({ width: 4, color: this.stroke });
    this.line.drawLine(points, this.curve);
  }
}
