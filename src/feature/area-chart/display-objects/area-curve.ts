import {
  Container,
  Graphics,
  hex2string,
  Rectangle,
  Texture,
} from "@ui/renderer";
import { CurveFactory, curveLinear } from "d3-shape";
import { memoize, values } from "lodash";

function createGradTexture(colorStop1: number, colorStop2: number, size = 600) {
  const canvas = document.createElement("canvas");

  // adjust it if somehow you need better quality for very very big images
  canvas.width = 1;
  canvas.height = size;

  const ctx = canvas.getContext("2d");

  // use canvas2d API to create gradient
  const grd = ctx!.createLinearGradient(0, 0, 0, size);
  grd.addColorStop(0, hex2string(colorStop1));
  grd.addColorStop(1, hex2string(colorStop2));

  ctx!.fillStyle = grd;
  ctx!.fillRect(0, 0, 1, size);

  return Texture.from(canvas);
}

const createTexture = memoize(
  (colorStop1: number, colorStop2: number, size: number) => {
    const gradTexture = createGradTexture(colorStop1, colorStop2, size);

    gradTexture.orig = new Rectangle(0, 0, 1, size);
    gradTexture._frame = new Rectangle(0, 0, 1, size);

    return gradTexture;
  },
  (...args) => values(args).join("_"),
);

/**
 * Draws an area curve
 */
export class AreaCurve extends Container {
  private area: Graphics = new Graphics();
  private line: Graphics = new Graphics();

  private stroke: number;
  private fill: number;
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
    this.fill = fill;
    this.backgroundSurface = backgroundSurface;
    this.curve = curve;

    this.area.lineStyle({ width: 0 });
    this.line.lineStyle({ width: 4, color: stroke, alpha: 0.5 });

    this.addChild(this.area);
    this.addChild(this.line);
  }

  public update(
    points: [number, number, number][],
    height: number,
    resolution: number = 1,
    fill: number = 0xffffff,
    stroke: number = 0,
    backgroundSurface: number = 0,
  ): void {
    this.fill = fill;
    this.stroke = stroke;
    this.backgroundSurface = backgroundSurface;
    this.area.clear();

    this.area.beginTextureFill({
      alpha: 0.5,
      texture: createTexture(this.stroke, this.backgroundSurface, height),
    });

    this.area.drawArea(points, this.curve);
    this.area.endFill();

    this.line.clear();
    this.line.lineStyle({ width: 4, color: this.stroke });
    this.line.drawLine(
      points.map((d) => [d[0], d[2]]),
      this.curve,
    );
  }
}
