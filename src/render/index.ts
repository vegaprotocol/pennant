import { CandleDetailsExtended, Scenegraph } from "../types";
import { ScaleLinear, ScaleTime } from "d3-scale";

import { ZoomTransform } from "d3-zoom";
import { recalculateScales } from "../scales";

export function drawChart(
  event: any,
  timeScale: ScaleTime<number, number, never>,
  timeScaleRescaled: ScaleTime<number, number, never>,
  data: CandleDetailsExtended[],
  scenegraph: Scenegraph,
  scalesRef: React.MutableRefObject<ScaleLinear<number, number, never>[]>,
  requestRedraw: () => void,
  onBoundsChanged: ((bounds: [Date, Date]) => void) | undefined
) {
  const transform: ZoomTransform = event.transform;
  const range = timeScale.range().map(transform.invertX, transform);
  const domain = range.map(timeScale.invert, timeScale);

  timeScaleRescaled.domain(domain);

  const filteredData = data.filter(
    (d) => d.date > domain[0] && d.date < domain[1]
  );

  recalculateScales(scenegraph, filteredData, scalesRef);

  requestRedraw();
  onBoundsChanged?.(domain as [Date, Date]);
}
