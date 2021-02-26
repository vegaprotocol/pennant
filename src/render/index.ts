import { ScaleLinear, ScaleTime } from "d3-scale";

import { CandleDetailsExtended } from "../types/element";
import { View } from "../types/vega-spec-types";
import { ZoomTransform } from "d3-zoom";
import { recalculateScales } from "../scales";

export function drawChart(
  transform: ZoomTransform,
  previousZoomTransform: React.MutableRefObject<ZoomTransform>,
  x: ScaleTime<number, number, never>,
  isPinnedRef: React.MutableRefObject<boolean>,
  xr: ScaleTime<number, number, never>,
  data: CandleDetailsExtended[],
  view: View[],
  scalesRef: React.MutableRefObject<ScaleLinear<number, number, never>[]>,
  requestRedraw: () => void,
  onBoundsChanged: ((bounds: [Date, Date]) => void) | undefined
) {
  const k = transform.k / previousZoomTransform.current.k;
  const range = x.range().map(transform.invertX, transform);

  let diff = 0;

  if (k === 1) {
    isPinnedRef.current = false;
  } else {
    diff = isPinnedRef.current ? range[1] - x.range()[1] : 0;
  }

  const domain = [range[0] - diff, range[1] - diff].map(x.invert, x);

  xr.domain(domain);

  const filteredData = data.filter(
    (d) => d.date > domain[0] && d.date < domain[1]
  );

  recalculateScales(view, filteredData, scalesRef);

  previousZoomTransform.current = transform;

  requestRedraw();
  onBoundsChanged?.(domain as [Date, Date]);
}
