import {
  Container,
  Graphics,
  hex2string,
  Rectangle,
  Texture,
} from "@ui/renderer";
import { CurveFactory, curveStepBefore } from "d3-shape";
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
  canvas.height = Math.max(1, Math.abs(size + offset));

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

    gradTexture.orig = new Rectangle(
      0,
      0,
      1,
      Math.max(1, Math.abs(size + offset)),
    );
    gradTexture._frame = new Rectangle(
      0,
      0,
      1,
      Math.max(1, Math.abs(size + offset)),
    );

    return gradTexture;
  },
  (...args) => values(args).join("_"),
);

/**
 * Draws an area curve
 */
export class PriceCurve extends Container {
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
    curve: CurveFactory = curveStepBefore,
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
    points: [number, number][],
    height: number,
    resolution: number = 1,
    fill: number = 0xffffff,
    stroke: number = 0,
    backgroundSurface: number = 0,
    invert: boolean,
    startPrice: number,
  ): void {
    this.fill = fill;
    this.stroke = stroke;
    this.backgroundSurface = backgroundSurface;
    this.area.clear();

    this.area.beginTextureFill({
      alpha: 0.5,
      texture: createTexture(
        this.stroke,
        this.backgroundSurface,
        height,
        startPrice,
        invert,
      ),
    });

    this.area.drawArea(
      points.map((d) => [d[0], startPrice, d[1]]),
      this.curve,
    );
    this.area.endFill();

    this.line.clear();
    this.line.lineStyle({ width: 4, color: this.stroke });
    this.line.drawLine(points, this.curve);
  }
}
