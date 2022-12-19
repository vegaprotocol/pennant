import { Container } from "../display";
import { Graphics } from "../graphics";
import { SHAPES } from "../math";
import { Renderer } from "./renderer";

export class CanvasMaskSystem {
  private renderer: Renderer;
  private _foundShapes: Graphics[] = [];

  constructor(renderer: Renderer) {
    this.renderer = renderer;
  }

  /**
   * This method adds it to the current stack of masks.
   * @param maskData - the maskData that will be pushed
   */
  pushMask(maskData: Graphics): void {
    const renderer = this.renderer;
    const maskObject = maskData as Container;

    renderer.canvasContext?.activeContext?.save();
    const foundShapes = this._foundShapes;

    this.recursiveFindShapes(maskObject, foundShapes);

    if (foundShapes.length > 0) {
      const context = renderer.canvasContext?.activeContext;

      context?.beginPath();

      for (let i = 0; i < foundShapes.length; i++) {
        const shape = foundShapes[i];
        const transform = shape.transform.worldTransform;

        this.renderer.canvasContext?.setContextTransform(transform);

        this.renderGraphicsShape(shape);
      }

      foundShapes.length = 0;
      context?.clip();
    }
  }

  recursiveFindShapes(container: Container, out: Graphics[]): void {
    if (
      (container as Graphics).geometry &&
      (container as Graphics).geometry.graphicsData
    ) {
      out.push(container as Graphics);
    }

    const { children } = container;

    if (children) {
      for (let i = 0; i < children.length; i++) {
        this.recursiveFindShapes(children[i] as Container, out);
      }
    }
  }

  renderGraphicsShape(graphics: Graphics): void {
    graphics.finishPoly();

    const context = this.renderer.canvasContext?.activeContext;

    if (!context) {
      return;
    }

    const graphicsData = graphics.geometry.graphicsData;
    const len = graphicsData.length;

    if (len === 0) {
      return;
    }

    for (let i = 0; i < len; i++) {
      const data = graphicsData[i];
      const shape = data.shape;

      if (shape.type === SHAPES.POLY) {
        let points = shape.points;
        let outerArea;
        let innerArea;
        let px;
        let py;

        context.moveTo(points[0], points[1]);

        for (let j = 1; j < points.length / 2; j++) {
          context.lineTo(points[j * 2], points[j * 2 + 1]);
        }

        // if the first and last point are the same close the path - much neater :)
        if (
          points[0] === points[points.length - 2] &&
          points[1] === points[points.length - 1]
        ) {
          context.closePath();
        }
      } else if (shape.type === SHAPES.RECT) {
        context.rect(shape.x, shape.y, shape.width, shape.height);
        context.closePath();
      } else if (shape.type === SHAPES.CIRCLE) {
        // TODO - need to be Undefined!
        context.arc(shape.x, shape.y, shape.radius, 0, 2 * Math.PI);
        context.closePath();
      }
    }
  }

  popMask(renderer: Renderer): void {
    renderer.canvasContext?.activeContext?.restore();
    //renderer.canvasContext?.invalidateBlendMode();
  }
}
