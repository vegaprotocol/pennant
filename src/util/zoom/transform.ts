export interface ZoomScale {
  domain(): number[] | Date[];
  domain(domain: Array<Date | number>): this;
  range(): number[];
  range(range: number[]): this;
  copy(): ZoomScale;
  invert(value: number): number | Date;
}

export class ZoomTransform {
  /**
   * The scale factor k.
   * This property should be considered read-only; instead of mutating a transform,
   * use transform.scale and transform.translate to derive a new transform.
   * Also see zoom.scaleBy, zoom.scaleTo and zoom.translateBy for convenience methods on the zoom behavior.
   */
  public readonly k: number;

  /**
   * The translation amount tx along the x-axis.
   * This property should be considered read-only; instead of mutating a transform,
   * use transform.scale and transform.translate to derive a new transform.
   * Also see zoom.scaleBy, zoom.scaleTo and zoom.translateBy for convenience methods on the zoom behavior.
   */
  public readonly x: number;

  /**
   * The translation amount ty along the y-axis
   * This property should be considered read-only; instead of mutating a transform,
   * use transform.scale and transform.translate to derive a new transform.
   * Also see zoom.scaleBy, zoom.scaleTo and zoom.translateBy for convenience methods on the zoom behavior.
   */
  public readonly y: number;

  constructor(k: number, x: number, y: number) {
    this.k = k;
    this.x = x;
    this.y = y;
  }

  /**
   * Return a transform whose scale k1 is equal to k0 × k, where k0 is this transform’s scale.
   *
   * @param k A scale factor.
   */
  public scale(k: number): ZoomTransform {
    return k === 1 ? this : new ZoomTransform(this.k * k, this.x, this.y);
  }

  public translate(x: number, y: number): ZoomTransform {
    return x === 0 && y === 0
      ? this
      : new ZoomTransform(this.k, this.x + this.k * x, this.y + this.k * y);
  }

  /**
   * Return the transformation of the specified point which is a two-element array of numbers [x, y].
   * The returned point is equal to [xk + tx, yk + ty].
   *
   * @param point Point coordinates [x, y]
   */
  public apply(point: [number, number]): [number, number] {
    return [point[0] * this.k + this.x, point[1] * this.k + this.y];
  }

  /**
   * Return the transformation of the specified x-coordinate, xk + tx.
   *
   * @param x Value of x-coordinate.
   */
  public applyX(x: number): number {
    return x * this.k + this.x;
  }

  /**
   * Return the transformation of the specified y-coordinate, yk + ty.
   *
   * @param y Value of y-coordinate.
   */
  public applyY(y: number): number {
    return y * this.k + this.y;
  }

  /**
   * Return the inverse transformation of the specified point which is a two-element array of numbers [x, y].
   * The returned point is equal to [(x - tx) / k, (y - ty) / k].
   *
   * @param point Point coordinates [x, y]
   */
  public invert(location: [number, number]): [number, number] {
    return [(location[0] - this.x) / this.k, (location[1] - this.y) / this.k];
  }

  /**
   * Return the inverse transformation of the specified x-coordinate, (x - tx) / k.
   *
   * @param x Value of x-coordinate.
   */
  public invertX(x: number): number {
    return (x - this.x) / this.k;
  }

  /**
   * Return the inverse transformation of the specified y-coordinate, (y - ty) / k.
   *
   * @param y Value of y-coordinate.
   */
  public invertY(y: number): number {
    return (y - this.y) / this.k;
  }

  /**
   * Returns a copy of the continuous scale x whose domain is transformed.
   * This is implemented by first applying the inverse x-transform on the scale’s range,
   * and then applying the inverse scale to compute the corresponding domain
   *
   * The scale x must use d3.interpolateNumber; do not use continuous.rangeRound as this
   * reduces the accuracy of continuous.invert and can lead to an inaccurate rescaled domain.
   * This method does not modify the input scale x; x thus represents the untransformed scale,
   * while the returned scale represents its transformed view.
   *
   * @param xScale A continuous scale for x-dimension.
   */
  public rescaleX(x: ZoomScale): ZoomScale {
    return x.copy().domain(x.range().map(this.invertX, this).map(x.invert, x));
  }

  /**
   * Returns a copy of the continuous scale y whose domain is transformed.
   * This is implemented by first applying the inverse y-transform on the scale’s range,
   * and then applying the inverse scale to compute the corresponding domain
   *
   * The scale y must use d3.interpolateNumber; do not use continuous.rangeRound as this
   * reduces the accuracy of continuous.invert and can lead to an inaccurate rescaled domain.
   * This method does not modify the input scale x; x thus represents the untransformed scale,
   * while the returned scale represents its transformed view.
   *
   * @param yScale A continuous scale for y-dimension.
   */
  public rescaleY(y: ZoomScale): ZoomScale {
    return y.copy().domain(y.range().map(this.invertY, this).map(y.invert, y));
  }

  public toString() {
    return "translate(" + this.x + "," + this.y + ") scale(" + this.k + ")";
  }
}

export const zoomIdentity: ZoomTransform = new ZoomTransform(1, 0, 0);
