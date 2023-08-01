import { ScaleLinear, ScaleTime } from "@util/types";
import { Selection } from "d3-selection";
import { ZoomBehavior, zoomIdentity, ZoomTransform } from "d3-zoom";

import { Panes } from "../core";
import { PlotArea } from "../plot-area";

export function recalculateScale(
  xTransform: () => ZoomTransform,
  xScale: ScaleTime,
  yScales: Record<string, ScaleLinear>,
  id: string,
  plotAreas: { [id: string]: PlotArea },
  yElements: Panes<Selection<Element, unknown, null, undefined>>,
  yZooms: Panes<ZoomBehavior<Element, unknown>>,
) {
  const xr = xTransform().rescaleX(xScale);
  const domain = xr.domain() as [Date, Date];
  const originalExtent = yScales[id].range();
  const newExtent = plotAreas[id].extent(domain);
  const originalHeight = Math.abs(originalExtent[0] - originalExtent[1]);

  const newHeight = Math.abs(
    yScales[id](newExtent[1]) - yScales[id](newExtent[0]),
  );

  yElements[id].call(
    yZooms[id].transform,
    zoomIdentity
      .translate(0, originalHeight / 2)
      .scale(originalHeight / newHeight)
      .translate(
        0,
        -(yScales[id](newExtent[0]) + yScales[id](newExtent[1])) / 2,
      ),
  );
}
