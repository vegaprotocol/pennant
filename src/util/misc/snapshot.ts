import * as React from "react";

// TODO: Make non-visible
function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  return canvas;
}

/**
 * Produces an image of the chart.
 *
 * @param chartRef React ref to chart component
 * @returns A promise that will fulfill with a new Blob object represnting a file containing an image or null.
 */
export async function asyncSnapshot(
  chartRef: React.RefObject<HTMLElement>,
): Promise<Blob | null> {
  if (chartRef.current) {
    const bbox = chartRef.current.getBoundingClientRect();

    // FIXME: These queries are extremely brittle. Replace with something more robust.
    const panes =
      chartRef.current.querySelectorAll<HTMLDivElement>(".pane__pane");

    const paneElements = [];

    for (const pane of panes) {
      paneElements.push({
        plotArea: pane.querySelector<HTMLCanvasElement>(".plot-area canvas"),
        yAxis: pane.querySelector<HTMLCanvasElement>(".y-axis canvas"),
      });
    }

    const xAxisCanvas = chartRef.current.querySelector<HTMLCanvasElement>(
      ".x-axis canvas",
    ) as HTMLCanvasElement;

    const devicePixelRatio = window.devicePixelRatio;

    const width = devicePixelRatio * bbox.width;
    const height = devicePixelRatio * bbox.height;

    const offscreen =
      "OffscreenCanvas" in window
        ? new OffscreenCanvas(width, height)
        : createCanvas(width, height);

    const offScreenContext = offscreen.getContext("2d") as any;

    if (offScreenContext) {
      let offset = 0;

      for (const paneElement of paneElements) {
        offScreenContext.drawImage(paneElement.plotArea!, 0, offset);
        offScreenContext.drawImage(paneElement.yAxis!, 0, offset);

        offset += paneElement.plotArea!.height;

        offScreenContext.save();
        offScreenContext.lineWidth = 2;
        offScreenContext.beginPath();
        offScreenContext.moveTo(0, offset + 0.5);
        offScreenContext.lineTo(width, offset + 0.5);

        offScreenContext.strokeStyle = "#fff";
        offScreenContext.stroke();
        offScreenContext.closePath();
        offScreenContext.restore();
      }

      offScreenContext.drawImage(xAxisCanvas, 0, offset);

      // TODO: Replace with user-defined type-guard
      if ("OffscreenCanvas" in window) {
        return await (offscreen as any).convertToBlob();
      } else {
        return new Promise<Blob | null>(function (resolve, reject) {
          (offscreen as HTMLCanvasElement).toBlob(function (blob) {
            resolve(blob);
          });
        });
      }
    } else {
      return null;
    }
  } else {
    return null;
  }
}
