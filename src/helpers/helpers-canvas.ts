export function alignPixel(pixelRatio: number, pixel: number, width: number) {
  const halfWidth = width / 2;
  return Math.round((pixel - halfWidth) * pixelRatio) / pixelRatio + halfWidth;
}

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
