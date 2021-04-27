import { ScaleLinear, ScaleTime } from "../../types";
import { ZoomTransform, zoomIdentity } from "d3-zoom";

import { PlotAreaInterface } from "../plot-area";

export function recalculateScale(
  xTransform: () => ZoomTransform,
  xScale: ScaleTime,
  yScales: Record<string, ScaleLinear>,
  id: string,
  plotAreas: Record<string, PlotAreaInterface>,
  plotAreaElements: any,
  yZooms: any
) {
  const xr = xTransform().rescaleX(xScale);
  const bounds = xr.domain() as [Date, Date];
  const originalExtent = yScales[id].range();
  const newExtent = plotAreas[id].extent(bounds);
  const originalHeight = Math.abs(originalExtent[0] - originalExtent[1]);

  const newHeight = Math.abs(
    yScales[id](newExtent[1]) - yScales[id](newExtent[0])
  );

  plotAreaElements[id].call(
    yZooms[id].transform,
    zoomIdentity
      .translate(0, originalHeight / 2)
      .scale(originalHeight / (1.3 * newHeight))
      .translate(
        0,
        -(
          yScales[id](newExtent[0]) -
          0.1 * newHeight +
          yScales[id](newExtent[1]) +
          0.2 * newHeight
        ) / 2
      )
  );
}
