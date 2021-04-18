import { ScaleLinear, ScaleTime } from "d3-scale";

import { Scenegraph } from "../types";
import { ZoomTransform } from "d3-zoom";

export function drawChart(
  index: number,
  event: any,
  timeScale: ScaleTime<number, number, never>,
  timeScaleRescaled: ScaleTime<number, number, never>,
  plotScale: ScaleLinear<number, number, never>,
  plotScaleRescaled: ScaleLinear<number, number, never>,
  studyScale: ScaleLinear<number, number, never>,
  studyScaleRescaled: ScaleLinear<number, number, never>,
  scenegraph: Scenegraph,
  requestRedraw: () => void,
  onBoundsChanged: ((bounds: [Date, Date]) => void) | undefined
) {
  const transform: ZoomTransform = event.transform;

  const timeRange = timeScale.range().map(transform.invertX, transform);
  const timeDomain = timeRange.map(timeScale.invert, timeScale);
  timeScaleRescaled.domain(timeDomain);

  if (index === 0) {
    const plotRange = plotScale.range().map(transform.invertY, transform);
    const plotDomain = plotRange.map(plotScale.invert, plotScale);
    plotScaleRescaled.domain(plotDomain);
  } else {
    const studyRange = studyScale.range().map(transform.invertY, transform);
    const studyDomain = studyRange.map(studyScale.invert, studyScale);
    studyScaleRescaled.domain(studyDomain);
  }

  const filteredData = scenegraph.panels.map((panel) =>
    panel.originalData.filter(
      (d) => d.date > timeDomain[0] && d.date < timeDomain[1]
    )
  );

  //recalculateScales(scenegraph, filteredData, scalesRef);

  requestRedraw();

  onBoundsChanged?.(timeDomain as [Date, Date]);
}

export function drawChartNoTransform(
  timeScaleRescaled: ScaleTime<number, number, never>,
  scenegraph: Scenegraph,
  requestRedraw: () => void,
  onBoundsChanged: ((bounds: [Date, Date]) => void) | undefined
) {
  const domain = timeScaleRescaled.domain();

  const filteredData = scenegraph.panels.map((panel) =>
    panel.originalData.filter((d) => d.date > domain[0] && d.date < domain[1])
  );

  requestRedraw();
  onBoundsChanged?.(domain as [Date, Date]);
}
