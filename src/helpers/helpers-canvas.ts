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

export function align(x: number, pixelRatio: number = 1) {
  return Math.round(pixelRatio * Math.round(x)) / pixelRatio + 0.5 / pixelRatio;
}

export function alignSpan(x: number, pixelRatio: number = 1) {
  return Math.round(pixelRatio * Math.round(x)) / pixelRatio;
}
