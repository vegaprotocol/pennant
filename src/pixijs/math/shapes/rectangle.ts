export class Rectangle {
  constructor(
    public x: number = 0,
    public y: number = 0,
    public width: number = 0,
    public height: number = 0
  ) {}

  get left(): number {
    return this.x;
  }

  get right(): number {
    return this.x + this.width;
  }

  get top(): number {
    return this.y;
  }

  get bottom(): number {
    return this.y + this.height;
  }

  static get EMPTY(): Rectangle {
    return new Rectangle(0, 0, 0, 0);
  }

  clone(): Rectangle {
    return new Rectangle(this.x, this.y, this.width, this.height);
  }

  copyFrom(rectangle: Rectangle): Rectangle {
    this.x = rectangle.x;
    this.y = rectangle.y;
    this.width = rectangle.width;
    this.height = rectangle.height;

    return this;
  }

  copyTo(rectangle: Rectangle): Rectangle {
    rectangle.x = this.x;
    rectangle.y = this.y;
    rectangle.width = this.width;
    rectangle.height = this.height;

    return rectangle;
  }

  contains(x: number, y: number): boolean {
    if (this.width <= 0 || this.height <= 0) {
      return false;
    }

    if (x >= this.x && x < this.x + this.width) {
      if (y >= this.y && y < this.y + this.height) {
        return true;
      }
    }

    return false;
  }

  ceil(resolution = 1, eps = 0.001): this {
    const x2 = Math.ceil((this.x + this.width - eps) * resolution) / resolution;
    const y2 =
      Math.ceil((this.y + this.height - eps) * resolution) / resolution;

    this.x = Math.floor((this.x + eps) * resolution) / resolution;
    this.y = Math.floor((this.y + eps) * resolution) / resolution;

    this.width = x2 - this.x;
    this.height = y2 - this.y;

    return this;
  }
}
