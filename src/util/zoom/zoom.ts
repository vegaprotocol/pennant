import { zoomIdentity, ZoomTransform } from "./transform";

function defaultConstrain(
  transform: ZoomTransform,
  extent: [[number, number], [number, number]],
  translateExtent: [[number, number], [number, number]],
): ZoomTransform {
  const dx0 = transform.invertX(extent[0][0]) - translateExtent[0][0];
  const dx1 = transform.invertX(extent[1][0]) - translateExtent[1][0];
  const dy0 = transform.invertY(extent[0][1]) - translateExtent[0][1];
  const dy1 = transform.invertY(extent[1][1]) - translateExtent[1][1];

  return transform.translate(
    dx1 > dx0 ? (dx0 + dx1) / 2 : Math.min(0, dx0) || Math.max(0, dx1),
    dy1 > dy0 ? (dy0 + dy1) / 2 : Math.min(0, dy0) || Math.max(0, dy1),
  );
}

export class Zoom {
  public __zoom: ZoomTransform = zoomIdentity;

  /**
   * A constraint function which returns a transform given the current transform, viewport extent and translate extent.
   * The default implementation attempts to ensure that the viewport extent does not go outside the translate extent.
   */
  public constrain: (
    transform: ZoomTransform,
    extent: [[number, number], [number, number]],
    translateExtent: [[number, number], [number, number]],
  ) => ZoomTransform = defaultConstrain;

  /**
   * The scale extent is an array of numbers [k0, k1] where k0 is the minimum allowed scale factor and k1 is the maximum allowed scale factor,
   * and return this zoom behavior.
   *
   * The scale extent restricts zooming in and out. It is enforced on interaction and when using zoom.scaleBy, zoom.scaleTo and zoom.translateBy;
   * however, it is not enforced when using zoom.transform to set the transform explicitly.
   *
   * The default scale extent is [0, infinity].
   */
  public scaleExtent = [0, Infinity];

  /**
   * The translate extent is an array of points [[x0, y0], [x1, y1]], where [x0, y0] is the top-left corner of the world and [x1, y1]
   * is the bottom-right corner of the world, and return this zoom behavior.
   *
   * The translate extent restricts panning, and may cause translation on zoom out. It is enforced on interaction and when using zoom.scaleBy, zoom.scaleTo and zoom.translateBy;
   * however, it is not enforced when using zoom.transform to set the transform explicitly.
   *
   * The default scale extent is [[-infinity, infinity], [-infinity, infinity]].
   */
  public translateExtent: [[number, number], [number, number]] = [
    [-Infinity, -Infinity],
    [Infinity, Infinity],
  ];

  /**
   * The viewport extent to the specified array of points [[x0, y0], [x1, y1]], where [x0, y0] is the top-left corner of the viewport
   * and [x1, y1] is the bottom-right corner of the viewport, and returns this zoom behavior.
   */
  public extent: [[number, number], [number, number]] = [
    [0, 0],
    [10_000, 10_000],
  ];

  public scaleBy(k: number, p: [number, number]) {
    this.scaleTo(this.__zoom.k * k, p);
  }

  public scaleTo(k: number, p: [number, number]) {
    this.transform(
      this.constrain(
        this.translate(this.scale(this.__zoom, k), p, this.__zoom.invert(p)),
        this.extent,
        this.translateExtent,
      ),
    );
  }

  public translateBy(x: number, y: number) {
    this.transform(
      this.constrain(
        this.__zoom.translate(x, y),
        this.extent,
        this.translateExtent,
      ),
    );
  }

  public translateTo(x: number, y: number, p: [number, number]) {
    this.transform(
      this.constrain(
        zoomIdentity
          .translate(p[0], p[1])
          .scale(this.__zoom.k)
          .translate(-x, -y),
        this.extent,
        this.translateExtent,
      ),
    );
  }

  public transform(transform: ZoomTransform) {
    this.__zoom = transform;
  }

  public wheeled(
    wheelDelta: number,
    point: [number, number],
    viewportExtent: [[number, number], [number, number]],
  ) {
    const t = this.__zoom;

    const k = Math.max(
      this.scaleExtent[0],
      Math.min(this.scaleExtent[1], t.k * Math.pow(2, wheelDelta)),
    );

    this.scaleTo(k, point);
  }

  public scale(transform: ZoomTransform, k: number) {
    const constrainedK = Math.max(
      this.scaleExtent[0],
      Math.min(this.scaleExtent[1], k),
    );

    return constrainedK === transform.k
      ? transform
      : new ZoomTransform(constrainedK, transform.x, transform.y);
  }

  public translate(
    transform: ZoomTransform,
    p0: [number, number],
    p1: [number, number],
  ): ZoomTransform {
    const x = p0[0] - p1[0] * transform.k;
    const y = p0[1] - p1[1] * transform.k;

    return x === transform.x && y === transform.y
      ? transform
      : new ZoomTransform(transform.k, x, y);
  }
}
