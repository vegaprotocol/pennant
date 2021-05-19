import { GraphicsGeometry } from ".";
import { Renderer } from "../canvas";
import { Point } from "../display";
import { Container } from "../display/container";

export class Graphics extends Container {
  private _geometry: GraphicsGeometry;

  public get geometry(): GraphicsGeometry {
    return this._geometry;
  }

  constructor(geometry: GraphicsGeometry) {
    super();
    this._geometry = geometry;
  }

  /**
   * Renders the object using the Canvas renderer
   *
   * @param renderer - The renderer
   */
  protected _render(renderer: Renderer): void {
    renderer.graphics.render(this);
  }

  public containsPoint(point: Point): boolean {
    console.log("containsPoint");
    return this._geometry.containsPoint(point);
  }
}
