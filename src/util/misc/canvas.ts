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
  fillStyle?: string,
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
