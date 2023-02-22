import { RenderableElement, ScaleLinear, ScaleTime } from "@util/types";

function addNoDataPath(
  ctx: CanvasRenderingContext2D,
  xScale: ScaleTime,
  yScale: ScaleLinear,
  position: Date | null,
  color: string
) {
  const x = position;

  const xRange = xScale.range().map(Math.round);
  const yRange = yScale.range().map(Math.round);

  ctx.save();

  //ctx.setLineDash([4, 6]);
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#979797";

  ctx.rect(xRange[0], yRange[1], xScale(x!) - xRange[0], yRange[0] - yRange[1]);

  ctx.fillStyle = "#1f1f1f";
  ctx.fill();

  if (x) {
    ctx.beginPath();
    ctx.moveTo(Math.round(xScale(x)), yRange[0]);
    ctx.lineTo(Math.round(xScale(x)), yRange[1]);
    ctx.stroke();
    ctx.closePath();
  }

  ctx.font = `12px monospace`;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("Market opened", xScale(x!) - 12, (yRange[0] - yRange[1]) / 2);
  ctx.fillText(
    x!.toLocaleString(),
    xScale(x!) - 12,
    (yRange[0] - yRange[1]) / 2 + 20
  );

  ctx.restore();
}

export class NoDataElement implements RenderableElement {
  draw(
    ctx: CanvasRenderingContext2D,
    xScale: ScaleTime,
    yScale: ScaleLinear,
    pixelRatio: number = 1,
    position: Date | null,
    color: string
  ) {
    addNoDataPath(ctx, xScale, yScale, position, color);
  }
}
