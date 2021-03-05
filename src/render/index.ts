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
  const k = transform.k / previousZoomTransform.current.k;
  const range = timeScale.range().map(transform.invertX, transform);

  let diff = 0;

  console.info(isPinnedRef.current, transform);

  if (k === 1 && previousZoomTransform.current.x !== transform.x) {
    isPinnedRef.current = false;
    selectAll(".d3fc-canvas-layer.crosshair").classed("grabbing", true);
  }

  const domain = [range[0] - diff, range[1] - diff].map(
    timeScale.invert,
    timeScale
  );

  timeScaleRescaled.domain(domain);

  const filteredData = data.filter(
    (d) => d.date > domain[0] && d.date < domain[1]
  );

  recalculateScales(view, filteredData, scalesRef);

  previousZoomTransform.current = transform;

  requestRedraw();
  onBoundsChanged?.(domain as [Date, Date]);
}
