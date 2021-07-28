import { area, line } from "d3-shape";
import { Renderer } from "../core";
import {
  Area,
  Circle,
  Line,
  Matrix,
  Polygon,
  Rectangle,
  SHAPES,
} from "../math";
import { Graphics } from "./graphics";
import { FillStyle } from "./styles/fill-style";
import { LineStyle } from "./styles/line-style";

export class GraphicsRenderer {
  public renderer: Renderer;

  private _tempMatrix: Matrix;

  constructor(renderer: Renderer) {
    this.renderer = renderer;
    this._tempMatrix = new Matrix();
  }

  public render(graphics: Graphics): void {
    const renderer = this.renderer;
    const context = renderer.context;
    const transform = graphics.transform.worldTransform;

    renderer.setContextTransform(transform);

    const graphicsData = graphics.geometry.graphicsData;

    let contextFillStyle;
    let contextStrokeStyle;

    const tintR = ((graphics.tint >> 16) & 0xff) / 255;
    const tintG = ((graphics.tint >> 8) & 0xff) / 255;
    const tintB = (graphics.tint & 0xff) / 255;

    for (let i = 0; i < graphicsData.length; i++) {
      const data = graphicsData[i];
      const shape = data.shape;
      const fillStyle = data.fillStyle ?? new FillStyle();
      const lineStyle = data.lineStyle ?? new LineStyle();

      const fillColor = data?.fillStyle?.color ?? 0;
      const lineColor = data?.lineStyle?.color ?? 0;

      if (data.matrix) {
        renderer.setContextTransform(
          transform.copyTo(this._tempMatrix).append(data.matrix)
        );
      }

      const fillTint =
        (((((fillColor >> 16) & 0xff) / 255) * tintR * 255) << 16) +
        (((((fillColor >> 8) & 0xff) / 255) * tintG * 255) << 8) +
        ((fillColor & 0xff) / 255) * tintB * 255;

      contextFillStyle = this._calcCanvasStyle(fillTint);

      const lineTint =
        (((((lineColor >> 16) & 0xff) / 255) * tintR * 255) << 16) +
        (((((lineColor >> 8) & 0xff) / 255) * tintG * 255) << 8) +
        ((lineColor & 0xff) / 255) * tintB * 255;

      contextStrokeStyle = this._calcCanvasStyle(lineTint);

      context.lineWidth = lineStyle?.width ?? 0;

      if (data.type === SHAPES.POLY) {
        context.beginPath();

        const tempShape = shape as Polygon;

        let points = tempShape.points;

        context.moveTo(points[0], points[1]);

        for (let j = 2; j < points.length; j += 2) {
          context.lineTo(points[j], points[j + 1]);
        }

        if (tempShape.closeStroke) {
          context.closePath();
        }

        if (fillStyle.visible) {
          context.globalAlpha = fillStyle.alpha;
          context.fillStyle = contextFillStyle;
          context.fill();
        }

        if (lineStyle.visible) {
          this.paintPolygonStroke(
            tempShape,
            lineStyle,
            contextStrokeStyle,
            context
          );
        }
      } else if (data.type === SHAPES.LINE) {
        const tempShape = shape as Line;

        context.globalAlpha = fillStyle.alpha;

        context.strokeStyle = contextStrokeStyle;

        context.beginPath();

        line().curve(tempShape.curve).context(context)(tempShape.data);

        context.stroke();
      } else if (data.type === SHAPES.AREA) {
        const tempShape = shape as Area;

        context.globalAlpha = fillStyle.alpha;

        context.strokeStyle = contextStrokeStyle;

        context.beginPath();

        area().curve(tempShape.curve).y0(tempShape.y0).context(context)(
          tempShape.data
        );

        if (fillStyle.visible) {
          context.globalAlpha = fillStyle.alpha;
          context.fillStyle = contextFillStyle;
          context.fill();
        }

        context.stroke();
      } else if (data.type === SHAPES.RECT) {
        const tempShape = shape as Rectangle;

        if (fillStyle.visible) {
          context.globalAlpha = fillStyle.alpha;
          context.fillStyle = contextFillStyle;

          context.fillRect(
            tempShape.x,
            tempShape.y,
            tempShape.width,
            tempShape.height
          );
        }

        if (lineStyle.visible) {
          const alignmentOffset = (lineStyle?.width ?? 0) * -0.5;
          const width = tempShape.width + 2 * alignmentOffset;
          const height = tempShape.height + 2 * alignmentOffset;

          context.strokeStyle = contextStrokeStyle;
          context.strokeRect(
            tempShape.x - alignmentOffset,
            tempShape.y - alignmentOffset,
            width,
            height
          );
        }
      } else if (data.type === SHAPES.CIRCLE) {
        const tempShape = shape as Circle;

        // TODO - need to be Undefined!
        context.beginPath();
        context.arc(tempShape.x, tempShape.y, tempShape.radius, 0, 2 * Math.PI);
        context.closePath();

        if (fillStyle.visible) {
          context.globalAlpha = fillStyle.alpha;
          context.fillStyle = contextFillStyle;
          context.fill();
        }

        if (lineStyle.visible) {
          context.globalAlpha = lineStyle.alpha;
          context.strokeStyle = contextStrokeStyle;
          context.stroke();
        }
      }
    }
  }

  private paintPolygonStroke(
    shape: Polygon,
    lineStyle: LineStyle,
    contextStrokeStyle: string | CanvasPattern,
    context: CanvasRenderingContext2D
  ): void {
    context.globalAlpha = lineStyle.alpha;
    context.strokeStyle = contextStrokeStyle;
    context.setLineDash(lineStyle.lineDash);
    context.stroke();
  }

  private _calcCanvasStyle(tint: number): string {
    return `#${`00000${(tint | 0).toString(16)}`.substr(-6)}`;
  }
}
