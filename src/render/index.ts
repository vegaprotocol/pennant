import { ScaleLinear, ScaleTime } from "d3-scale";

import { CandleDetailsExtended } from "../types/element";
import { View } from "../types/vega-spec-types";
import { ZoomTransform } from "d3-zoom";
import { recalculateScales } from "../scales";
import { selectAll } from "d3-selection";

export function drawChart(
  event: any,
  previousZoomTransform: React.MutableRefObject<ZoomTransform>,
  timeScale: ScaleTime<number, number, never>,
  isPinnedRef: React.MutableRefObject<boolean>,
  timeScaleRescaled: ScaleTime<number, number, never>,
  data: CandleDetailsExtended[],
  view: View[],
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

  recalculateScales(view, filteredData, scalesRef);

  requestRedraw();
  onBoundsChanged?.(domain as [Date, Date]);
}
