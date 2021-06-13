/**
 * Clears the entire canvas.
 * @param {HTMLCanvasElement} canvas
 * @param {CanvasRenderingContext2D} [ctx]
 */

/**
 * Clears the entire canvas
 * @param canvas
 * @param ctx
 * @param fillStyle Optional fill style applied to canvas
 */
export function clearCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  fillStyle?: string
) {
  ctx.save();
  ctx.resetTransform();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.restore();
}

/**
 * Returns the aligned pixel value to avoid anti-aliasing blur
 * @param x - A pixel value
 * @param pixelRatio - Device pixel ratio
 * @returns The aligned pixel value
 */
export function align(x: number, pixelRatio: number = 1): number {
  return Math.round(pixelRatio * Math.round(x)) / pixelRatio + 0.5 / pixelRatio;
}

export function alignSpan(x: number, pixelRatio: number = 1) {
  return Math.round(pixelRatio * Math.round(x)) / pixelRatio;
}
