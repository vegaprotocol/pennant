export interface Element {
  draw(
    ctx: CanvasRenderingContext2D,
    xScale: any,
    yScale: any,
    ...rest: any[]
  ): void;
}
