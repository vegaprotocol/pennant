import { Matrix, PointData, Rectangle, Transform } from "../math";

export class Bounds {
  public minX: number;
  public minY: number;
  public maxX: number;
  public maxY: number;
  public rect: Rectangle | null;
  public updateID: number;

  constructor() {
    this.minX = Infinity;
    this.minY = Infinity;
    this.maxX = -Infinity;
    this.maxY = -Infinity;
    this.rect = null;
    this.updateID = -1;
  }

  /**
   * Checks if bounds are empty.
   */
  isEmpty(): boolean {
    return this.minX > this.maxX || this.minY > this.maxY;
  }

  /**
   * Clears the bounds and resets.
   */
  clear(): void {
    this.minX = Infinity;
    this.minY = Infinity;
    this.maxX = -Infinity;
    this.maxY = -Infinity;
  }

  public getRectangle(rect?: Rectangle): Rectangle {
    if (this.minX > this.maxX || this.minY > this.maxY) {
      return Rectangle.EMPTY;
    }

    rect = rect || new Rectangle(0, 0, 1, 1);

    rect.x = this.minX;
    rect.y = this.minY;
    rect.width = this.maxX - this.minX;
    rect.height = this.maxY - this.minY;

    return rect;
  }

  public addPoint(point: PointData): void {
    this.minX = Math.min(this.minX, point.x);
    this.maxX = Math.max(this.maxX, point.x);
    this.minY = Math.min(this.minY, point.y);
    this.maxY = Math.max(this.maxY, point.y);
  }

  /**
   * Adds a point, after transformed. This should be inlined when its possible.
   */
  addPointMatrix(matrix: Matrix, point: PointData): void {
    const { a, b, c, d, tx, ty } = matrix;

    const x = a * point.x + c * point.y + tx;
    const y = b * point.x + d * point.y + ty;

    this.minX = Math.min(this.minX, x);
    this.maxX = Math.max(this.maxX, x);
    this.minY = Math.min(this.minY, y);
    this.maxY = Math.max(this.maxY, y);
  }

  /**
   * Adds a quad, not transformed
   */
  addQuad(vertices: Float32Array): void {
    let minX = this.minX;
    let minY = this.minY;
    let maxX = this.maxX;
    let maxY = this.maxY;

    let x = vertices[0];
    let y = vertices[1];

    minX = x < minX ? x : minX;
    minY = y < minY ? y : minY;
    maxX = x > maxX ? x : maxX;
    maxY = y > maxY ? y : maxY;

    x = vertices[2];
    y = vertices[3];
    minX = x < minX ? x : minX;
    minY = y < minY ? y : minY;
    maxX = x > maxX ? x : maxX;
    maxY = y > maxY ? y : maxY;

    x = vertices[4];
    y = vertices[5];
    minX = x < minX ? x : minX;
    minY = y < minY ? y : minY;
    maxX = x > maxX ? x : maxX;
    maxY = y > maxY ? y : maxY;

    x = vertices[6];
    y = vertices[7];
    minX = x < minX ? x : minX;
    minY = y < minY ? y : minY;
    maxX = x > maxX ? x : maxX;
    maxY = y > maxY ? y : maxY;

    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;
  }

  public addFrame(
    transform: Transform,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
  ): void {
    this.addFrameMatrix(transform.worldTransform, x0, y0, x1, y1);
  }

  public addFrameMatrix(
    matrix: Matrix,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
  ): void {
    const a = matrix.a;
    const b = matrix.b;
    const c = matrix.c;
    const d = matrix.d;
    const tx = matrix.tx;
    const ty = matrix.ty;

    let minX = this.minX;
    let minY = this.minY;
    let maxX = this.maxX;
    let maxY = this.maxY;

    let x = a * x0 + c * y0 + tx;
    let y = b * x0 + d * y0 + ty;

    minX = x < minX ? x : minX;
    minY = y < minY ? y : minY;
    maxX = x > maxX ? x : maxX;
    maxY = y > maxY ? y : maxY;

    x = a * x1 + c * y0 + tx;
    y = b * x1 + d * y0 + ty;
    minX = x < minX ? x : minX;
    minY = y < minY ? y : minY;
    maxX = x > maxX ? x : maxX;
    maxY = y > maxY ? y : maxY;

    x = a * x0 + c * y1 + tx;
    y = b * x0 + d * y1 + ty;
    minX = x < minX ? x : minX;
    minY = y < minY ? y : minY;
    maxX = x > maxX ? x : maxX;
    maxY = y > maxY ? y : maxY;

    x = a * x1 + c * y1 + tx;
    y = b * x1 + d * y1 + ty;
    minX = x < minX ? x : minX;
    minY = y < minY ? y : minY;
    maxX = x > maxX ? x : maxX;
    maxY = y > maxY ? y : maxY;

    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;
  }

  /**
   * Adds screen vertices from array.
   */
  addVertexData(
    vertexData: Float32Array,
    beginOffset: number,
    endOffset: number,
  ): void {
    let minX = this.minX;
    let minY = this.minY;
    let maxX = this.maxX;
    let maxY = this.maxY;

    for (let i = beginOffset; i < endOffset; i += 2) {
      const x = vertexData[i];
      const y = vertexData[i + 1];

      minX = x < minX ? x : minX;
      minY = y < minY ? y : minY;
      maxX = x > maxX ? x : maxX;
      maxY = y > maxY ? y : maxY;
    }

    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;
  }

  public addVertices(
    transform: Transform,
    vertices: Float32Array,
    beginOffset: number,
    endOffset: number,
  ): void {
    this.addVerticesMatrix(
      transform.worldTransform,
      vertices,
      beginOffset,
      endOffset,
    );
  }

  public addVerticesMatrix(
    matrix: Matrix,
    vertices: Float32Array,
    beginOffset: number,
    endOffset: number,
    padX = 0,
    padY = padX,
  ): void {
    const a = matrix.a;
    const b = matrix.b;
    const c = matrix.c;
    const d = matrix.d;
    const tx = matrix.tx;
    const ty = matrix.ty;

    let minX = this.minX;
    let minY = this.minY;
    let maxX = this.maxX;
    let maxY = this.maxY;

    for (let i = beginOffset; i < endOffset; i += 2) {
      const rawX = vertices[i];
      const rawY = vertices[i + 1];
      const x = a * rawX + c * rawY + tx;
      const y = d * rawY + b * rawX + ty;

      minX = Math.min(minX, x - padX);
      maxX = Math.max(maxX, x + padX);
      minY = Math.min(minY, y - padY);
      maxY = Math.max(maxY, y + padY);
    }

    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;
  }

  public addBounds(bounds: Bounds): void {
    const minX = this.minX;
    const minY = this.minY;
    const maxX = this.maxX;
    const maxY = this.maxY;

    this.minX = bounds.minX < minX ? bounds.minX : minX;
    this.minY = bounds.minY < minY ? bounds.minY : minY;
    this.maxX = bounds.maxX > maxX ? bounds.maxX : maxX;
    this.maxY = bounds.maxY > maxY ? bounds.maxY : maxY;
  }

  public addBoundsMask(bounds: Bounds, mask: Bounds): void {
    const _minX = bounds.minX > mask.minX ? bounds.minX : mask.minX;
    const _minY = bounds.minY > mask.minY ? bounds.minY : mask.minY;
    const _maxX = bounds.maxX < mask.maxX ? bounds.maxX : mask.maxX;
    const _maxY = bounds.maxY < mask.maxY ? bounds.maxY : mask.maxY;

    if (_minX <= _maxX && _minY <= _maxY) {
      const minX = this.minX;
      const minY = this.minY;
      const maxX = this.maxX;
      const maxY = this.maxY;

      this.minX = _minX < minX ? _minX : minX;
      this.minY = _minY < minY ? _minY : minY;
      this.maxX = _maxX > maxX ? _maxX : maxX;
      this.maxY = _maxY > maxY ? _maxY : maxY;
    }
  }

  public addBoundsMatrix(bounds: Bounds, matrix: Matrix): void {
    this.addFrameMatrix(
      matrix,
      bounds.minX,
      bounds.minY,
      bounds.maxX,
      bounds.maxY,
    );
  }

  public addBoundsArea(bounds: Bounds, area: Rectangle): void {
    const _minX = bounds.minX > area.x ? bounds.minX : area.x;
    const _minY = bounds.minY > area.y ? bounds.minY : area.y;
    const _maxX =
      bounds.maxX < area.x + area.width ? bounds.maxX : area.x + area.width;
    const _maxY =
      bounds.maxY < area.y + area.height ? bounds.maxY : area.y + area.height;

    if (_minX <= _maxX && _minY <= _maxY) {
      const minX = this.minX;
      const minY = this.minY;
      const maxX = this.maxX;
      const maxY = this.maxY;

      this.minX = _minX < minX ? _minX : minX;
      this.minY = _minY < minY ? _minY : minY;
      this.maxX = _maxX > maxX ? _maxX : maxX;
      this.maxY = _maxY > maxY ? _maxY : maxY;
    }
  }

  /**
   * Pads bounds object, making it grow in all directions.
   * If paddingY is omitted, both paddingX and paddingY will be set to paddingX.
   */
  pad(paddingX = 0, paddingY = paddingX): void {
    if (!this.isEmpty()) {
      this.minX -= paddingX;
      this.maxX += paddingX;
      this.minY -= paddingY;
      this.maxY += paddingY;
    }
  }

  /**
   * Adds padded frame. (x0, y0) should be strictly less than (x1, y1)
   */
  addFramePad(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    padX: number,
    padY: number,
  ): void {
    x0 -= padX;
    y0 -= padY;
    x1 += padX;
    y1 += padY;

    this.minX = this.minX < x0 ? this.minX : x0;
    this.maxX = this.maxX > x1 ? this.maxX : x1;
    this.minY = this.minY < y0 ? this.minY : y0;
    this.maxY = this.maxY > y1 ? this.maxY : y1;
  }
}
